import { EventHandlerType, Location, Object, PauseId, TimeStampedPoint } from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";

import { createWakeable } from "../utils/suspense";
import { preCacheObject } from "./ObjectPreviews";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

type Value = any;

type AnalysisResult = {
  isRemote: boolean;
  pauseId: PauseId | null;
  values: Value[];
};

type RemoteAnalysisResult = {
  data: { objects: Object[] };
  pauseId: PauseId;
  values: Array<{ value?: any; object?: string }>;
};

const locationAndTimeToValueMap: Map<string, Record<AnalysisResult>> = new Map();

function getKey(location: Location, timeStampedPoint: TimeStampedPoint, code: string): string {
  return `${location.sourceId}:${location.line}:${location.column}:${timeStampedPoint.time}:${code}`;
}

export function getCachedAnalysis(
  location: Location,
  timeStampedPoint: TimeStampedPoint,
  code: string
): AnalysisResult | null {
  const key = getKey(location, timeStampedPoint, code);
  const record = locationAndTimeToValueMap.get(key);
  if (record?.status === STATUS_RESOLVED) {
    return record.value;
  } else {
    return null;
  }
}

export function getEventTypePoints(
  client: ReplayClientInterface,
  eventType: EventHandlerType
): any {
  /* TODO (console:filters)
    const collectedPoints: PointDescription[] = [];
    await analysisManager.runAnalysis(
      {
        mapper: `return [{ key: input.point, value: input }];`,
        effectful: false,
        eventHandlerEntryPoints: [{ eventType }],
      },
      {
        onAnalysisPoints: points => collectedPoints.push(...points),
      }
    );
    eventTypePoints[eventType] = collectedPoints;
  */
}

export function runAnalysis(
  client: ReplayClientInterface,
  location: Location,
  timeStampedPoint: TimeStampedPoint,
  code: string
): AnalysisResult {
  const key = getKey(location, timeStampedPoint, code);

  let record = locationAndTimeToValueMap.get(key);
  if (record == null) {
    const wakeable = createWakeable<AnalysisResult>();

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    locationAndTimeToValueMap.set(key, record);

    runLocalOrRemoteAnalysis(client, location, timeStampedPoint, code, record, wakeable);
  }

  if (record.status === STATUS_RESOLVED) {
    return record.value;
  } else {
    throw record.value;
  }
}

async function runLocalOrRemoteAnalysis(
  client: ReplayClientInterface,
  location: Location,
  timeStampedPoint: TimeStampedPoint,
  code: string,
  record: Record<AnalysisResult>,
  wakeable: Wakeable<AnalysisResult>
) {
  try {
    const values = await runLocalAnalysis(code);

    const analysisResult: AnalysisResult = {
      isRemote: false,
      pauseId: null,
      values,
    };

    record.status = STATUS_RESOLVED;
    record.value = analysisResult;

    wakeable.resolve(analysisResult);
  } catch (error) {
    try {
      const { pauseId, values } = await runRemoteAnalysis(client, location, timeStampedPoint, code);

      const analysisResult: AnalysisResult = {
        isRemote: true,
        pauseId,
        values,
      };

      record.status = STATUS_RESOLVED;
      record.value = analysisResult;

      wakeable.resolve(analysisResult);
    } catch (error) {
      record.status = STATUS_REJECTED;
      record.value = error;

      wakeable.reject(error);
    }
  }
}

export async function runLocalAnalysis(code: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (code === "location") {
      reject();
    }

    const escapedCode = code.replace(/"/g, '\\"');
    // Most globals (like window and document) aren't defined in a Worker, but the location global is.
    const workerCode = `
        const values = ((location) => eval("[${escapedCode}]"))(null);
        postMessage(values);
    `;
    const blob = new Blob([workerCode], { type: "text/javascript" });
    const objectURL = URL.createObjectURL(blob);
    const worker = new Worker(objectURL);
    worker.addEventListener("message", event => {
      resolve(event.data);
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
    }, 500);
  });
}

export async function runRemoteAnalysis(
  client: ReplayClientInterface,
  location: Location,
  timeStampedPoint: TimeStampedPoint,
  code: string
): Promise<{ pauseId: PauseId; values: Value[] }> {
  const result = await client.runAnalysis<RemoteAnalysisResult>(
    location,
    timeStampedPoint,
    createMapperForAnalysis(code)
  );
  const objects = result.data.objects;
  const pauseId = result.pauseId;
  const values = result.values;
  objects.forEach(object => preCacheObject(pauseId, object));
  return { pauseId, values };
}

function createMapperForAnalysis(code: string): string {
  const escapedCode = code.replace(/"/g, '\\"');
  return `
    const finalData = { frames: [], scopes: [], objects: [] };
    function addPauseData({ frames, scopes, objects }) {
          finalData.frames.push(...(frames || []));
          finalData.scopes.push(...(scopes || []));
          finalData.objects.push(...(objects || []));
    }
    function getTopFrame() {
          const { frame, data } = sendCommand("Pause.getTopFrame");
      addPauseData(data);
      return finalData.frames.find(f => f.frameId == frame);
    }

      const { point, time, pauseId } = input;
      const { frameId, functionName, location } = getTopFrame();

      const bindings = [
            { name: "displayName", value: functionName || "" }
      ];
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
      const { result: lengthResult } = sendCommand(
            "Pause.getObjectProperty",
        { object, name: "length" }
      );
      addPauseData(lengthResult.data);
      const length = lengthResult.returned.value;
      for (let i = 0; i < length; i++) {
            const { result: elementResult } = sendCommand(
              "Pause.getObjectProperty",
          { object, name: i.toString() }
        );
        values.push(elementResult.returned);
        addPauseData(elementResult.data);
      }
    }
      }
      return [{
            key: point,
            value: { time, pauseId, location, values, data: finalData },
      }];
    `;
}
