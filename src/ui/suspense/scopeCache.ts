import { FrameId, PauseId, Scope, SourceId } from "@replayio/protocol";

import {
  FrameScopes,
  getScopesAsync as getScopesAsyncNew,
  getScopesIfCached as getScopesIfCachedNew,
  getScopesSuspense as getScopesSuspenseNew,
} from "bvaughn-architecture-demo/src/suspense/ScopeCache";
import { replayClient } from "shared/client/ReplayClientContext";

export function getScopesSuspense(pauseId: PauseId, frameId: FrameId) {
  return getScopesSuspenseNew(replayClient, pauseId, frameId);
}

export function getScopesAsync(pauseId: PauseId, frameId: FrameId) {
  return getScopesAsyncNew(replayClient, pauseId, frameId);
}

export function getScopesIfCached(pauseId: PauseId, frameId: FrameId) {
  return getScopesIfCachedNew(pauseId, frameId);
}

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
