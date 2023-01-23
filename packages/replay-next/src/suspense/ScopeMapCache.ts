import { Location, VariableMapping } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { createGenericCache2 } from "./createGenericCache";

export const {
  getValueSuspense: getScopeMapSuspense,
  getValueAsync: getScopeMapAsync,
  getValueIfCached: getScopeMapIfCached,
} = createGenericCache2<ReplayClientInterface, [location: Location], VariableMapping[] | undefined>(
  "ScopeMapCache: getScopeMap",
  (client, location) => client.getScopeMap(location),
  location => `${location.sourceId}:${location.line}:${location.column}`
);
