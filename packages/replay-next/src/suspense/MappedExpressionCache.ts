import { Location } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { createCache } from "suspense";

export const mappedExpressionCache = createCache<
  [client: ReplayClientInterface, expression: string, location: Location],
  string
>({
  config: { immutable: true },
  debugLabel: "MappedExpressionCache",
  getKey: ([client, expression, location]) =>
    `${location.sourceId}:${location.line}:${location.column}:${expression}`,
  load: ([client, expression, location]) =>
    client.mapExpressionToGeneratedScope(expression, location),
});
