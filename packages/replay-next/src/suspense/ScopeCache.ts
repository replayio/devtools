import { FrameId, MappedLocation, PauseId, Scope, ScopeId } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

import { framesCache } from "./FrameCache";
import { cachePauseData } from "./PauseCache";
import { sourcesByIdCache } from "./SourcesCache";

export interface FrameScopes {
  frameLocation: MappedLocation;
  generatedScopes: Scope[];
  originalScopes: Scope[] | undefined;
}

export const scopesCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, scopeId: ScopeId],
  Scope
> = createCache({
  config: { immutable: true },
  debugLabel: "Scopes",
  getKey: ([replayClient, pauseId, scopeId]) => `${pauseId}:${scopeId}`,
  load: async ([replayClient, pauseId, scopeId]) => {
    const result = await replayClient.getScope(pauseId, scopeId);

    const sources = await sourcesByIdCache.readAsync(replayClient);
    cachePauseData(replayClient, sources, pauseId, result.data);

    // Caching PauseData should also cache values in this cache
    const cached = scopesCache.getValueIfCached(replayClient, pauseId, scopeId);
    assert(cached, `Scope ${scopeId} for pause ${pauseId} not found in cache`);

    return cached;
  },
});

export const frameScopesCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, frameId: FrameId],
  FrameScopes
> = createCache({
  config: { immutable: true },
  debugLabel: "FrameScopes",
  getKey: ([replayClient, pauseId, frameId]) => `${pauseId}:${frameId}`,
  load: async ([replayClient, pauseId, frameId]) => {
    const frame = (await framesCache.readAsync(replayClient, pauseId))?.find(
      frame => frame.frameId === frameId
    )!;
    const generatedScopes = await Promise.all(
      frame.scopeChain.map(scopeId => scopesCache.readAsync(replayClient, pauseId, scopeId))
    );
    const originalScopes = frame.originalScopeChain
      ? await Promise.all(
          frame.originalScopeChain.map(scopeId =>
            scopesCache.readAsync(replayClient, pauseId, scopeId)
          )
        )
      : undefined;

    return { frameLocation: frame.location, generatedScopes, originalScopes };
  },
});
