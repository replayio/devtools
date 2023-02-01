import {
  ExecutionPoint,
  Frame,
  Location,
  Object,
  PauseData,
  PauseId,
  PointRange,
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

import { createWakeable } from "../utils/suspense";
import { cachePauseData } from "./PauseCache";
import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

type Value = any;

type AnalysisResult = {
  executionPoint: ExecutionPoint;
  isRemote: boolean;
  pauseId: PauseId | null;
  time: number;
  values: Value[];
};

export type AnalysisResults = (timeStampedPoint: TimeStampedPoint) => AnalysisResult | null;

export type RemoteAnalysisResult = {
  data: { frames: Frame[]; objects: Object[]; scopes: Scope[] };
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

const locationAndTimeToValueMap: Map<string, Record<AnalysisResults>> = new Map();

// TODO (FE-469) Filter in-memory if the range gets smaller (and we haven't overflowed)
// Currently we re-run the analysis which seems wasteful.

export function runAnalysisSuspense(
  client: ReplayClientInterface,
  focusRange: PointRange | null,
  location: Location,
  code: string,
  condition: string | null
): AnalysisResults {
  const key = getKey(focusRange, location, code, condition);

  let record = locationAndTimeToValueMap.get(key);
  if (record == null) {
    const wakeable = createWakeable<AnalysisResults>(`runAnalysisSuspense: ${key}`);

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
  record: Record<AnalysisResults>,
  wakeable: Wakeable<AnalysisResults>
) {
  try {
    const analysisResults = await new Promise<AnalysisResults>((resolve, reject) => {
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
        const analysisResults: AnalysisResults = (timeStampedPoint: TimeStampedPoint) => ({
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
  record: Record<AnalysisResults>,
  wakeable: Wakeable<AnalysisResults>
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

function createMapperForCondition(condition: string): string {
  function conditionMapper() {
    const { result: conditionResult } = sendCommand("Pause.evaluateInFrame", {
      frameId,
      expression: "",
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

  const mapperBody = getFunctionBody(conditionMapper);
  const stringifiedCondition = JSON.stringify(condition);
  const mapperBodyWithExpression = mapperBody.replace(
    `expression: ""`,
    `expression: ${stringifiedCondition}`
  );
  return mapperBodyWithExpression;
}

// Variables in scope in an analysis
declare let sendCommand: SendCommand;
declare let input: AnalysisInput;
declare function addPauseData(pauseData: PauseData): void;
declare let frameId: string;

function createMapperForAnalysis(code: string, condition: string | null): string {
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
    const { point, time, pauseId } = input;
    const { frameId, location } = getTopFrame()!;

    // Location of the optional text to run the condition check and bail out early
    // $REPLACE_ME_CONDITION_MAPPER

    function addPauseData({ frames, scopes, objects }: PauseData) {
      finalData.frames.push(...(frames || []));
      finalData.scopes.push(...(scopes || []));
      finalData.objects.push(...(objects || []));
    }

    function getTopFrame() {
      const { frame, data } = sendCommand("Pause.getTopFrame", {});
      addPauseData(data);
      return finalData.frames.find(f => f.frameId == frame);
    }

    // Evaluate the user-provided code as the first field in an array
    const { result } = sendCommand("Pause.evaluateInFrame", {
      frameId,
      expression: `[$REPLACE_ME_ESCAPED_CODE]`,
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
        const length = lengthResult.returned!.value;
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

  // Insert the text of the user-provided analysis string
  analysisMapperBody = analysisMapperBody.replace("$REPLACE_ME_ESCAPED_CODE", escapedCode);

  if (condition) {
    const conditionMapper = createMapperForCondition(condition);
    // Insert the text of the user-provided condition string
    analysisMapperBody = analysisMapperBody.replace(
      `// $REPLACE_ME_CONDITION_MAPPER`,
      conditionMapper
    );
  }

  return analysisMapperBody;
}
