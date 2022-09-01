import {
  ExecutionPoint,
  Frame,
  Location,
  Object,
  PauseId,
  PointRange,
  Scope,
  TimeStampedPoint,
} from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";

import { createWakeable } from "../utils/suspense";
import { preCacheObjects } from "./ObjectPreviews";

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

export function runAnalysis(
  client: ReplayClientInterface,
  focusRange: PointRange | null,
  location: Location,
  code: string,
  condition: string | null
): AnalysisResults {
  const key = getKey(focusRange, location, code, condition);

  let record = locationAndTimeToValueMap.get(key);
  if (record == null) {
    const wakeable = createWakeable<AnalysisResults>();

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    locationAndTimeToValueMap.set(key, record);

    runAnalysisHelper(client, focusRange, location, code, condition, record, wakeable);
  }

  if (record.status === STATUS_RESOLVED) {
    return record.value;
  } else {
    throw record.value;
  }
}

async function runAnalysisHelper(
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
      const objects = result.data.objects;
      if (objects) {
        // Pre-cache pause data so we don't need to refetch when rendering in inspecting values in the console.
        preCacheObjects(result.pauseId, objects);
      }

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
  return `
    const { result: conditionResult } = sendCommand(
      "Pause.evaluateInFrame",
      { frameId, expression: ${JSON.stringify(condition)}, useOriginalScopes: true }
    );
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
  `;
}

function createMapperForAnalysis(code: string, condition: string | null): string {
  const escapedCode = code.replace(/"/g, '\\"');
  return `
    const finalData = { frames: [], scopes: [], objects: [] };
    const { point, time, pauseId } = input;
    const { frameId, functionName, location } = getTopFrame();

    ${condition ? createMapperForCondition(condition) : ""}

    function addPauseData({ frames, scopes, objects }) {
      finalData.frames.push(...(frames || []));
      finalData.scopes.push(...(scopes || []));
      finalData.objects.push(...(objects || []));
    }

    function getTopFrame() {
      const { frame, data } = sendCommand("Pause.getTopFrame");
      addPauseData(data);
      return finalData.frames.find((f) => f.frameId == frame);
    }

    const bindings = [{ name: "displayName", value: functionName || "" }];
    const { result } = sendCommand("Pause.evaluateInFrame", {
      frameId,
      bindings,
      expression: "[" + "${escapedCode}" + "]",
      useOriginalScopes: true,
    });
    const values = [];
    addPauseData(result.data);
    if (result.exception) {
      values.push(result.exception);
    } else {
      {
        const { object } = result.returned;
        const { result: lengthResult } = sendCommand("Pause.getObjectProperty", {
          object,
          name: "length",
        });
        addPauseData(lengthResult.data);
        const length = lengthResult.returned.value;
        for (let i = 0; i < length; i++) {
          const { result: elementResult } = sendCommand("Pause.getObjectProperty", {
            object,
            name: i.toString(),
          });
          values.push(elementResult.returned);
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
  `;
}
