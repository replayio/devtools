import { Location } from "@replayio/protocol";
import { createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

export const mappedExpressionCache = createCache<
  [client: ReplayClientInterface, expression: string, location: Location],
  string
>({
  debugLabel: "MappedExpressionCache",
  getKey: ([client, expression, location]) =>
    `${location.sourceId}:${location.line}:${location.column}:${expression}`,
  load: ([client, expression, location]) =>
    client.mapExpressionToGeneratedScope(expression, location),
});
