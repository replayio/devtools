import { ExecutionPoint, Frame, Location, Object, PauseId, Scope, TimeStampedPoint } from "@replayio/protocol";
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

type AnalysisResults = (timeStampedPoint: TimeStampedPoint) => AnalysisResult | null;

type RemoteAnalysisResult = {
  data: { frames: Frame[]; objects: Object[]; scopes: Scope[]; };
  location: Location;
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
  values: Array<{ value?: any; object?: string }>;
};

export type UncaughtException = RemoteAnalysisResult & {
  type: "UncaughtException";
};

let inProgressSourcesWakeable: Wakeable<RemoteAnalysisResult[]> | null = null;
let exceptions: UncaughtException[] | null = null;

const locationAndTimeToValueMap: Map<string, Record<AnalysisResults>> = new Map();

function getKey(location: Location, code: string): string {
  return `${location.sourceId}:${location.line}:${location.column}:${code}`;
}

// TODO (FE-469) Add focus region awareness to analysis.

export function getExceptions(client: ReplayClientInterface): UncaughtException[] {
  if (exceptions !== null) {
    return exceptions;
  }

  if (inProgressSourcesWakeable === null) {
    inProgressSourcesWakeable = createWakeable();
    fetchExceptions(client);
  }

  throw inProgressSourcesWakeable;
}

async function fetchExceptions(client: ReplayClientInterface) {
  const results = await client.runAnalysis<RemoteAnalysisResult>({
    effectful: false,
    exceptionPoints: true,
    mapper: EXCEPTIONS_MAPPER,
  });

  // This will avoid us having to turn around and request them again when rendering the logs.
  results.forEach(result => {
    if (result.data.objects) {
      preCacheObjects(result.pauseId, result.data.objects);
    }
  });

  exceptions = results.map(result => ({
    ...result,
    type: "UncaughtException",
  }));

  inProgressSourcesWakeable!.resolve(exceptions!);
  inProgressSourcesWakeable = null;
}

export function runAnalysis(
  client: ReplayClientInterface,
  location: Location,
  code: string
): AnalysisResults {
  const key = getKey(location, code);

  let record = locationAndTimeToValueMap.get(key);
  if (record == null) {
    const wakeable = createWakeable<AnalysisResults>();

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    locationAndTimeToValueMap.set(key, record);

    runLocalOrRemoteAnalysis(client, location, code, record, wakeable);
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
  code: string,
  record: Record<AnalysisResults>,
  wakeable: Wakeable<AnalysisResults>
) {
  try {
    const analysisResults = await runLocalAnalysis(code);

    record.status = STATUS_RESOLVED;
    record.value = analysisResults;

    wakeable.resolve(analysisResults);
  } catch (error) {
    try {
      const analysisResults = await runRemoteAnalysis(client, location, code);

      record.status = STATUS_RESOLVED;
      record.value = analysisResults;

      wakeable.resolve(analysisResults);
    } catch (error) {
      record.status = STATUS_REJECTED;
      record.value = error;

      wakeable.reject(error);
    }
  }
}

export async function runLocalAnalysis(code: string): Promise<AnalysisResults> {
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
    }, 500);
  });
}

export async function runRemoteAnalysis(
  client: ReplayClientInterface,
  location: Location,
  code: string
): Promise<AnalysisResults> {
  const results = await client.runAnalysis<RemoteAnalysisResult>({
    effectful: false,
    locations: [{ location }],
    mapper: createMapperForAnalysis(code),
  });

  if (results.length === 0) {
    throw new Error("No results returned from analysis");
  }

  const resultsMap = new Map();
  results.forEach(result => {
    const objects = result.data.objects;
    if (objects) {
      // This will avoid us having to turn around and request them again when rendering the logs.
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

  return (timeStampedPoint: TimeStampedPoint) => {
    return resultsMap.get(timeStampedPoint.point) || null;
  };
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
      return finalData.frames.find((f) => f.frameId == frame);
    }
    
    const { point, time, pauseId } = input;
    const { frameId, functionName, location } = getTopFrame();
    
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

const EXCEPTIONS_MAPPER = `
  const finalData = { frames: [], scopes: [], objects: [] };

  function addPauseData({ frames, scopes, objects }) {
    finalData.frames.push(...(frames || []));
    finalData.scopes.push(...(scopes || []));
    finalData.objects.push(...(objects || []));
  }

  function getTopFrame() {
    const { data, frame } = sendCommand("Pause.getTopFrame");
    addPauseData(data);
    return finalData.frames.find(f => f.frameId == frame);
  }

  const { pauseId, point, time } = input;
  const { frameId, location } = getTopFrame();
  const { data: exceptionData, exception } = sendCommand("Pause.getExceptionValue");
  addPauseData(exceptionData);

  return [{
    key: time,
    value: { data: finalData, location, pauseId, point, time, values: [exception] },
  }];
`;
