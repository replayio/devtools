import { Location, VariableMapping } from "@replayio/protocol";
import { createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

export const {
  read: getScopeMapSuspense,
  readAsync: getScopeMapAsync,
  getValueIfCached: getScopeMapIfCached,
} = createCache<[Location, ReplayClientInterface], VariableMapping[] | undefined>({
  debugLabel: "ScopeMapCache",
  getKey: location => `${location.sourceId}:${location.line}:${location.column}`,
  load: (location, client) => client.getScopeMap(location),
});
