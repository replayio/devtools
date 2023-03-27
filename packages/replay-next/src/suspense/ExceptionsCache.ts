import { PauseId, PointDescription, PointSelector, Value } from "@replayio/protocol";
import { createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { createInfallibleSuspenseCache } from "../utils/suspense";
import { createAnalysisCache } from "./AnalysisCache";
import { cachePauseData } from "./PauseCache";

export type UncaughtException = PointDescription & {
  type: "UncaughtException";
};

export const exceptionsCache = createAnalysisCache<UncaughtException, []>(
  "ExceptionsCache",
  () => "",
  (client, begin, end) => client.findPoints(pointSelector, { begin, end }),
  () => ({ selector: pointSelector, expression: "[]" }),
  transformPoint
);

export const getInfallibleExceptionPointsSuspense = createInfallibleSuspenseCache(
  exceptionsCache.pointsIntervalCache.read
);

const pointSelector: PointSelector = { kind: "exceptions" };

function transformPoint(pointDescription: PointDescription): UncaughtException {
  return { type: "UncaughtException", ...pointDescription };
}

export const exceptionValueCache = createCache<
  [client: ReplayClientInterface, pauseId: PauseId],
  Value | undefined
>({
  debugLabel: "ExceptionValueCache",
  getKey: ([client, pauseId]) => pauseId,
  load: async ([client, pauseId]) => {
    const result = await client.getExceptionValue(pauseId);
    cachePauseData(client, pauseId, result.data);
    return result.exception;
  },
});
