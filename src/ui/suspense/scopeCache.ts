import { FrameId, PauseId, Scope } from "@replayio/protocol";
import { createGenericCache } from "@bvaughn/src/suspense/createGenericCache";
import { Pause } from "protocol/thread/pause";
import { assert } from "protocol/utils";

interface FrameScopes {
  scopes: Scope[];
  originalScopesUnavailable: boolean;
}

export const {
  getValueSuspense: getScopesSuspense,
  getValueAsync: getScopesAsync,
  getValueIfCached: getScopesIfCached,
} = createGenericCache<[PauseId, FrameId], FrameScopes>(
  async (pauseId, frameId) => {
    const pause = Pause.getById(pauseId);
    assert(pause, `no pause for ${pauseId}`);
    const { scopes: wiredScopes, originalScopesUnavailable } = await pause.getScopes(frameId);
    const scopes = wiredScopes.map(f => pause!.rawScopes.get(f.scopeId)!);
    return { scopes, originalScopesUnavailable };
  },
  (pauseId, frameId) => `${pauseId}:${frameId}`
);
