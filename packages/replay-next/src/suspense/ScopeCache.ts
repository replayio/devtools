import { FrameId, MappedLocation, PauseId, Scope, ScopeId } from "@replayio/protocol";

import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

import { createGenericCache } from "./createGenericCache";
import { framesCache } from "./FrameCache";
import { cachePauseData } from "./PauseCache";

export interface FrameScopes {
  frameLocation: MappedLocation;
  generatedScopes: Scope[];
  originalScopes: Scope[] | undefined;
}

export const {
  getValueSuspense: getScopeSuspense,
  getValueAsync: getScopeAsync,
  getValueIfCached: getScopeIfCached,
  addValue: cacheScope,
} = createGenericCache<
  [replayClient: ReplayClientInterface],
  [pauseId: PauseId, scopeId: ScopeId],
  Scope
>(
  "ScopeCache: getScope",
  async (pauseId, scopeId, client) => {
    const result = await client.getScope(pauseId, scopeId);
    await client.waitForLoadedSources();
    cachePauseData(client, pauseId, result.data);
    const cached: { value: Scope } | undefined = getScopeIfCached(pauseId, scopeId);
    assert(cached, `Scope ${scopeId} for pause ${pauseId} not found in cache`);
    return cached.value;
  },
  (pauseId, scopeId) => `${pauseId}:${scopeId}`
);

export const {
  getValueSuspense: getFrameScopesSuspense,
  getValueAsync: getFrameScopesAsync,
  getValueIfCached: getFrameScopesIfCached,
} = createGenericCache<
  [replayClient: ReplayClientInterface],
  [pauseId: PauseId, frameId: FrameId],
  FrameScopes
>(
  "ScopeCache: getFrameScopes",
  async (pauseId, frameId, client) => {
    const frame = (await framesCache.readAsync(client, pauseId))?.find(
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

    return { frameLocation: frame.location, generatedScopes, originalScopes };
  },
  (pauseId, frameId) => `${pauseId}:${frameId}`
);
