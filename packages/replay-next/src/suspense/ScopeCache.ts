import { FrameId, MappedLocation, PauseId, Scope, ScopeId } from "@replayio/protocol";
import { createCache } from "suspense";

import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

import { getFramesAsync } from "./FrameCache";
import { cachePauseData } from "./PauseCache";

export interface FrameScopes {
  frameLocation: MappedLocation;
  generatedScopes: Scope[];
  originalScopes: Scope[] | undefined;
}

export const {
  cache: cacheScope,
  getValueIfCached: getScopeIfCached,
  read: getScopeSuspense,
  readAsync: getScopeAsync,
} = createCache<[PauseId, ScopeId, ReplayClientInterface], Scope>({
  debugLabel: "ScopeCache: getScope",
  load: async (pauseId: PauseId, scopeId: ScopeId, client: ReplayClientInterface) => {
    const result = await client.getScope(pauseId, scopeId);
    await client.waitForLoadedSources();
    cachePauseData(client, pauseId, result.data);
    const cached: Scope | undefined = getScopeIfCached(pauseId, scopeId, client);
    assert(cached, `Scope ${scopeId} for pause ${pauseId} not found in cache`);
    return cached!;
  },
});

export const {
  getValueIfCached: getFrameScopesIfCached,
  read: getFrameScopesSuspense,
  readAsync: getFrameScopesAsync,
} = createCache<[PauseId, FrameId, ReplayClientInterface], FrameScopes>({
  debugLabel: "ScopeCache: getFrameScopes",
  load: async (pauseId: PauseId, frameId: FrameId, client: ReplayClientInterface) => {
    const frame = (await getFramesAsync(pauseId, client))?.find(
      frame => frame.frameId === frameId
    )!;

    const generatedScopes = await Promise.all(
      frame.scopeChain.map(scopeId => getScopeAsync(pauseId, scopeId, client))
    );
    const originalScopes = frame.originalScopeChain
      ? await Promise.all(
          frame.originalScopeChain.map(scopeId => getScopeAsync(pauseId, scopeId, client))
        )
      : undefined;

    return { frameLocation: frame.location, generatedScopes: generatedScopes!, originalScopes };
  },
});
