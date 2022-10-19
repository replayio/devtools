import { FrameId, MappedLocation, PauseId, Scope, SourceId } from "@replayio/protocol";
import { createGenericCache } from "bvaughn-architecture-demo/src/suspense/createGenericCache";
import { Pause, ThreadFront } from "protocol/thread";
import { assert } from "protocol/utils";

interface FrameScopes {
  frameLocation: MappedLocation;
  generatedScopes: Scope[];
  originalScopes: Scope[] | undefined;
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
    const frame = (await pause.getFrames())?.find(frame => frame.frameId === frameId);
    assert(frame, `no frame with ID ${frameId} found in pause ${pauseId}`);

    const generatedScopes = await pause.ensureScopeChain(frame.scopeChain);
    const originalScopes = frame.originalScopeChain
      ? await pause.ensureScopeChain(frame.originalScopeChain)
      : undefined;

    return { frameLocation: frame.location, generatedScopes, originalScopes };
  },
  (pauseId, frameId) => `${pauseId}:${frameId}`
);

export interface PickedScopes {
  scopes: Scope[];
  originalScopesUnavailable: boolean;
}

// pick either generated or original scopes, depending on availability and user preference
export function pickScopes(
  scopes: FrameScopes,
  preferredGeneratedSources: SourceId[]
): PickedScopes {
  let scopeChain = scopes.generatedScopes;
  let originalScopesUnavailable = false;
  const hasPreferredGeneratedSource = scopes.frameLocation.some(location =>
    preferredGeneratedSources.includes(location.sourceId)
  );
  if (scopes.originalScopes && !hasPreferredGeneratedSource) {
    // if all original variables are unavailable (usually due to sourcemap issues),
    // we show the generated scope chain with a warning message instead
    originalScopesUnavailable = scopes.originalScopes.every(scope =>
      (scope.bindings || []).every(binding => binding.unavailable)
    );
    if (!originalScopesUnavailable) {
      scopeChain = scopes.originalScopes;
    }
  }
  return { scopes: scopeChain, originalScopesUnavailable };
}
