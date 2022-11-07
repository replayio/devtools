import { FrameId, MappedLocation, PauseId, Scope, ScopeId } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { createGenericCache2 } from "./createGenericCache";
import { getFramesAsync } from "./FrameCache";
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
} = createGenericCache2<ReplayClientInterface, [pauseId: PauseId, scopeId: ScopeId], Scope>(
  async (client, pauseId, scopeId) => {
    const result = await client.getScope(pauseId, scopeId);
    await client.waitForLoadedSources();
    cachePauseData(client, pauseId, result.data);
    return result.data.scopes!.find(scope => scope.scopeId === scopeId)!;
  },
  (pauseId, scopeId) => `${pauseId}:${scopeId}`
);

export const {
  getValueSuspense: getScopesSuspense,
  getValueAsync: getScopesAsync,
  getValueIfCached: getScopesIfCached,
} = createGenericCache2<ReplayClientInterface, [pauseId: PauseId, frameId: FrameId], FrameScopes>(
  async (client, pauseId, frameId) => {
    const frame = (await getFramesAsync(client, pauseId))?.find(
      frame => frame.frameId === frameId
    )!;
    const generatedScopes = await Promise.all(
      frame.scopeChain.map(scopeId => getScopeAsync(client, pauseId, scopeId))
    );
    const originalScopes = frame.originalScopeChain
      ? await Promise.all(
          frame.originalScopeChain.map(scopeId => getScopeAsync(client, pauseId, scopeId))
        )
      : undefined;

    return { frameLocation: frame.location, generatedScopes, originalScopes };
  },
  (pauseId, frameId) => `${pauseId}:${frameId}`
);
