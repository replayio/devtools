import { FrameId, PauseId, Scope } from "@replayio/protocol";
import { createGenericCache } from "bvaughn-architecture-demo/src/suspense/createGenericCache";
import { Pause } from "protocol/thread/pause";
import { assert } from "protocol/utils";

export interface FrameScopes {
  scopes: Scope[];
  originalScopesUnavailable: boolean;
}

export const {
  getValueSuspense: getScopesSuspense,
  getValueAsync: getScopesAsync,
  getValueIfCached: getScopesIfCached,
} = createGenericCache<[pauseId: PauseId, frameId: FrameId], FrameScopes>(
  async (pauseId, frameId) => {
    const pause = Pause.getById(pauseId);
    assert(pause, `no pause for ${pauseId}`);
    // Wait until the pause is "created" to see if we have frames
    await pause.createWaiter;
    if (!pause.hasFrames) {
      return { scopes: [], originalScopesUnavailable: true };
    }

    const { scopes, originalScopesUnavailable } = await pause.getScopes(frameId);
    return { scopes, originalScopesUnavailable };
  },
  (pauseId, frameId) => `${pauseId}:${frameId}`
);
