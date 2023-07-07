import { PauseId, PointDescription, PointSelector, Value } from "@replayio/protocol";
import { createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { createInfallibleSuspenseCache } from "../utils/suspense";
import { createAnalysisCache } from "./AnalysisCache";
import { cachePauseData } from "./PauseCache";
import { sourcesByIdCache } from "./SourcesCache";

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

const pointSelector: PointSelector = { kind: "exceptions" };

function transformPoint(pointDescription: PointDescription): UncaughtException {
  return { type: "UncaughtException", ...pointDescription };
}

export const getInfallibleExceptionPointsSuspense = createInfallibleSuspenseCache(
  exceptionsCache.pointsIntervalCache.read
);

export const exceptionValueCache = createCache<
  [client: ReplayClientInterface, pauseId: PauseId],
  Value | undefined
>({
  config: { immutable: true },
  debugLabel: "ExceptionValueCache",
  getKey: ([client, pauseId]) => pauseId,
  load: async ([client, pauseId]) => {
    const result = await client.getExceptionValue(pauseId);
    const sources = await sourcesByIdCache.readAsync(client);
    cachePauseData(client, sources, pauseId, result.data);
    return result.exception;
  },
});
