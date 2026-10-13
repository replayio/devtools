import { Location, VariableMapping } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

export const scopeMapCache: Cache<
  [replayClient: ReplayClientInterface, location: Location],
  VariableMapping[] | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "ScopeMap",
  getKey: ([client, location]) => `${location.sourceId}:${location.line}:${location.column}`,
  load: async ([client, location]) => client.getScopeMap(location),
});
