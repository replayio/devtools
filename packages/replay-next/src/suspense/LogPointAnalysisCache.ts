import {
  ExecutionPoint,
  Location,
  PauseId,
  PointDescription,
  PointRange,
  TimeStampedPoint,
  Value,
} from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { parse } from "replay-next/src/suspense/SyntaxParsingCache";
import { ReplayClientInterface } from "shared/client/types";

import { createFetchAsyncFromFetchSuspense } from "../utils/suspense";
import { createAnalysisCache } from "./AnalysisCache";
import { hitPointsCache } from "./HitPointsCache";
import { mappedExpressionCache } from "./MappedExpressionCache";

export type LogPointAnalysisResult = {
  executionPoint: ExecutionPoint;
  failed: boolean;
  isRemote: boolean;
  pauseId: PauseId | null;
  time: number;
  values: Value[];
};

const logPointAnalysisCache = createAnalysisCache<
  PointDescription,
  [location: Location, code: string, condition: string | null]
>(
  "LogPointAnalysisCache",
  (location, code, condition) =>
    `${location.sourceId}:${location.line}:${location.column}:${code}:${condition}`,
  async (client, begin, end, location, code, condition) => {
    const pointDescriptions = await hitPointsCache.readAsync(
      BigInt(begin),
      BigInt(end),
      client,
      location,
      condition
    );
    return pointDescriptions.map(({ point, time }) => ({ point, time }));
  },
  async (client, points, location, code, condition) => {
    const mappedCode = await mappedExpressionCache.readAsync(client, `[${code}]`, location);
    return {
      selector: {
        kind: "points",
        points: points.map(point => point.point),
      },
      expression: mappedCode,
      frameIndex: 0,
    };
  },
  point => point
);

export function getLogPointAnalysisResultSuspense(
  client: ReplayClientInterface,
  range: PointRange,
  point: TimeStampedPoint,
  location: Location,
  code: string,
  condition: string | null
): LogPointAnalysisResult {
  if (canRunLocalAnalysis(code, condition)) {
    const localResult = localAnalysisCache.read(code);
    return {
      executionPoint: point.point,
      failed: false,
      isRemote: false,
      pauseId: null,
      time: point.time,
      values: localResult,
    };
  } else {
    // the LoggablesContext doesn't call logPointAnalysisCache.pointsIntervalCache.read(Async)
    // because it uses points from the HitPointsCache instead (which is more efficient
    // as it shares the points with other parts of the UI), so we call it here to ensure
    // that the analysis is run for the given range
    logPointAnalysisCache.pointsIntervalCache.readAsync(
      BigInt(range.begin),
      BigInt(range.end),
      client,
      location,
      code,
      condition
    );

    const remoteResult = logPointAnalysisCache.resultsCache.read(
      point.point,
      location,
      code,
      condition
    );
    return {
      executionPoint: remoteResult.point,
      failed: remoteResult.failed,
      isRemote: true,
      pauseId: remoteResult.pauseId,
      time: remoteResult.time,
      values: remoteResult.values,
    };
  }
}

export const getLogPointAnalysisResultAsync = createFetchAsyncFromFetchSuspense(
  getLogPointAnalysisResultSuspense
);

export function canRunLocalAnalysis(code: string, condition: string | null): boolean {
  if (condition) {
    return false;
  }

  const tokens = parse(code, "fake.js").flat();
  for (let token of tokens) {
    const { types, value } = token;
    if (value === "this") {
      return false;
    }
    if (types && types.length > 0) {
      const type = types[0];
      switch (type) {
        case "propertyName": {
          return false;
        }
        case "variableName":
        case "variableName2": {
          switch (value) {
            case "false":
            case "Infinity":
            case "NaN":
            case "null":
            case "true":
            case "undefined":
              break;
            default:
              return false;
          }
        }
      }
    }
  }

  return true;
}

export const localAnalysisCache: Cache<[code: string], any[]> = createCache({
  config: { immutable: true },
  debugLabel: "localAnalysisCache",
  getKey: ([code]) => code,
  load: async ([code]) =>
    new Promise<any[]>((resolve, reject) => {
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
        resolve(event.data);
        clearTimeout(timeoutID);
      });
      worker.addEventListener("error", event => {
        reject(
          new Error(
            `Received error "${
              event.message
            }" from worker while evaluating "${escapedCode}" (${JSON.stringify(
              [...escapedCode].map(char => char.codePointAt(0))
            )})`
          )
        );
        clearTimeout(timeoutID);
      });
      worker.postMessage("start");
      const timeoutID = setTimeout(() => {
        worker.terminate();
        reject("Timed out");
      }, 5000);
    }),
});
