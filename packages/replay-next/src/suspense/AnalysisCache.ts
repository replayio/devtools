import {
  ExecutionPoint,
  Frame,
  Location,
  PauseData,
  PauseId,
  PointRange,
  Object as ProtocolObject,
  Scope,
  TimeStampedPoint,
} from "@replayio/protocol";
import jsTokens from "js-tokens";

import {
  AnalysisInput,
  AnalysisResultWrapper,
  SendCommand,
  getFunctionBody,
} from "protocol/evaluation-utils";
import { ReplayClientInterface } from "shared/client/types";

import { createFetchAsyncFromFetchSuspense, createWakeable } from "../utils/suspense";
import { cachePauseData } from "./PauseCache";
import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

type Value = any;

export type AnalysisResult = {
  executionPoint: ExecutionPoint;
  isRemote: boolean;
  pauseId: PauseId | null;
  time: number;
  values: Value[];
};

export type GetAnalysisResult = (timeStampedPoint: TimeStampedPoint) => AnalysisResult | null;

export type RemoteAnalysisResult = {
  data: { frames: Frame[]; objects: ProtocolObject[]; scopes: Scope[] };
  location: Location | Location[];
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
  values: Array<{ value?: any; object?: string }>;
};

function getKey(
  focusRange: PointRange | null,
  location: Location,
  code: string,
  condition: string | null
): string {
  const rangeString = focusRange ? `${focusRange.begin}-${focusRange.end}` : "-";
  return `${rangeString}:${location.sourceId}:${location.line}:${location.column}:${code}:${
    condition || ""
  }`;
}

const locationAndTimeToValueMap: Map<string, Record<GetAnalysisResult>> = new Map();

// TODO (FE-469) Filter in-memory if the range gets smaller (and we haven't overflowed)
// Currently we re-run the analysis which seems wasteful.

export function runAnalysisSuspense(
  client: ReplayClientInterface,
  focusRange: PointRange | null,
  location: Location,
  code: string,
  condition: string | null
): GetAnalysisResult {
  const key = getKey(focusRange, location, code, condition);

  let record = locationAndTimeToValueMap.get(key);
  if (record == null) {
    const wakeable = createWakeable<GetAnalysisResult>(`runAnalysisSuspense: ${key}`);

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    locationAndTimeToValueMap.set(key, record);

    if (!condition && canRunLocalAnalysis(code)) {
      runLocalAnalysis(code, record, wakeable);
    } else {
      runRemoteAnalysis(client, focusRange, location, code, condition, record, wakeable);
    }
  }

  if (record.status === STATUS_RESOLVED) {
    return record.value;
  } else {
    throw record.value;
  }
}

export const runAnalysisAsync = createFetchAsyncFromFetchSuspense(runAnalysisSuspense);

export function canRunLocalAnalysis(code: string): boolean {
  const tokens = jsTokens(code);
  // @ts-ignore
  for (let token of tokens) {
    switch (token.type) {
      case "IdentifierName": {
        switch (token.value) {
          case "false":
          case "Infinity":
          case "NaN":
          case "null":
          case "true":
          case "undefined": {
            // Supported
            break;
          }
          default: {
            return false;
          }
        }
        break;
      }
      case "Punctuator": {
        switch (token.value) {
          case ",": {
            // Supported
            break;
          }
          default: {
            return false;
          }
        }
        break;
      }
      case "NoSubstitutionTemplate":
      case "NumericLiteral":
      case "StringLiteral":
      case "WhiteSpace": {
        // supported
        break;
      }
      default: {
        return false;
      }
    }
  }

  return true;
}

async function runLocalAnalysis(
  code: string,
  record: Record<GetAnalysisResult>,
  wakeable: Wakeable<GetAnalysisResult>
) {
  try {
    const analysisResults = await new Promise<GetAnalysisResult>((resolve, reject) => {
      if (code === "location") {
        reject();
      }

      const escapedCode = code.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      // Most globals (like window and document) aren't defined in a Worker, but the location global is.
      const workerCode = `
          const values = (() => eval("[${escapedCode}]"))();
          postMessage(values);
      `;
      const blob = new Blob([workerCode], { type: "text/javascript" });
      const objectURL = URL.createObjectURL(blob);
      const worker = new Worker(objectURL);
      worker.addEventListener("message", event => {
        const values = event.data;
        const analysisResults: GetAnalysisResult = (timeStampedPoint: TimeStampedPoint) => ({
          executionPoint: timeStampedPoint.point,
          isRemote: false,
          pauseId: null,
          time: timeStampedPoint.time,
          values,
        });

        resolve(analysisResults);
        clearTimeout(timeoutID);
      });
      worker.addEventListener("error", event => {
        reject(event.message);
        clearTimeout(timeoutID);
      });
      worker.postMessage("start");
      const timeoutID = setTimeout(() => {
        worker.terminate();
        reject("Timed out");
      }, 5000);
    });

    record.status = STATUS_RESOLVED;
    record.value = analysisResults;

    wakeable.resolve(analysisResults);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

async function runRemoteAnalysis(
  client: ReplayClientInterface,
  focusRange: PointRange | null,
  location: Location,
  code: string,
  condition: string | null,
  record: Record<GetAnalysisResult>,
  wakeable: Wakeable<GetAnalysisResult>
) {
  try {
    const results = await client.runAnalysis<RemoteAnalysisResult>({
      effectful: false,
      location,
      mapper: createMapperForAnalysis(code, condition),
      range: focusRange || undefined,
    });

    const resultsMap = new Map();
    results.forEach(result => {
      cachePauseData(client, result.pauseId, result.data);

      resultsMap.set(result.point, {
        executionPoint: result.point,
        isRemote: true,
        pauseId: result.pauseId,
        time: result.time,
        values: result.values,
      });
    });

    const analysisResults = (timeStampedPoint: TimeStampedPoint) => {
      return resultsMap.get(timeStampedPoint.point) || null;
    };

    record.status = STATUS_RESOLVED;
    record.value = analysisResults;

    wakeable.resolve(analysisResults);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

// Variables in scope in an analysis
declare let sendCommand: SendCommand;
declare let input: AnalysisInput;

// Additional variables we'll be injecting to the mapper string
declare let injectedValues: {
  condition: string | null;
  escapedCodeExpression: string;
};

function createMapperForAnalysis(code: string, userCondition: string | null): string {
  const escapedCode = code.replace(/"/g, '\\"');

  /**
   * An evaluated Analysis mapper function that in turn evaluates code in the top frame
   * and returns the results.
   *
   * The input code string is expected to be a comma-separated array of expressions.
   *
   * If a `condition` is provided, the mapper will evaluate the condition and bail out
   * with no results if the result is falsy.
   */
  function analysisMapper(): AnalysisResultWrapper<RemoteAnalysisResult>[] {
    const finalData: Required<PauseData> = { frames: [], scopes: [], objects: [] };

    function addPauseData({ frames, scopes, objects }: PauseData) {
      finalData.frames.push(...(frames || []));
      finalData.scopes.push(...(scopes || []));
      finalData.objects.push(...(objects || []));
    }

    const { point, time, pauseId } = input;

    const { frame, data } = sendCommand("Pause.getTopFrame", {});
    addPauseData(data);
    const { frameId, location } = finalData.frames.find(f => f.frameId == frame)!;

    if (injectedValues.condition) {
      const { result: conditionResult } = sendCommand("Pause.evaluateInFrame", {
        frameId,
        expression: injectedValues.condition,
        useOriginalScopes: true,
      });
      addPauseData(conditionResult.data);
      if (conditionResult.returned) {
        const { returned } = conditionResult;
        if ("value" in returned && !returned.value) {
          return [];
        }
        if (!Object.keys(returned).length) {
          // Undefined.
          return [];
        }
      }
    }

    const { result } = sendCommand("Pause.evaluateInFrame", {
      frameId,
      // Turn the comma-separated user-provided expression into an array of values
      expression: `[${injectedValues.escapedCodeExpression}]`,
      useOriginalScopes: true,
    });
    const values = [];
    addPauseData(result.data);
    if (result.exception) {
      values.push(result.exception);
    } else {
      {
        // Extract the contents of the array via the protocol
        const { object } = result.returned!;
        const { result: lengthResult } = sendCommand("Pause.getObjectProperty", {
          object: object!,
          name: "length",
        });
        addPauseData(lengthResult.data);
        const length = lengthResult.returned?.value ?? 0;
        for (let i = 0; i < length; i++) {
          const { result: elementResult } = sendCommand("Pause.getObjectProperty", {
            object: object!,
            name: i.toString(),
          });
          values.push(elementResult.returned!);
          addPauseData(elementResult.data);
        }
      }
    }
    return [
      {
        key: point,
        value: { time, pauseId, point, location, values, data: finalData },
      },
    ];
  }

  let analysisMapperBody = getFunctionBody(analysisMapper);

  // Unlike evaluations, which _cannot_ have an explicit `return` statement,
  // Analysis mappers _must_ have a `return` statement.
  // Also, the backend requires that all `sendCommand()` calls must exist at the
  // top level of the body, as it will rewrite the logic to use generator syntax
  // with a Babel transform on the backend.
  // Because of that, we can't use an IIFE the way that the React Event Listener
  // logic does. We construct this mapper as a single snippet, no function wrapper.
  const finalAnalysisMapper = `
    const injectedValues = {
      condition: ${userCondition ? JSON.stringify(userCondition) : null},
      escapedCodeExpression:  "${escapedCode}"
    }

    ${analysisMapperBody}
  `;

  return finalAnalysisMapper;
}
