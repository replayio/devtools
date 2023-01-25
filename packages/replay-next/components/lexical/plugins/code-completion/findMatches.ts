import { FrameId, PauseId, Property, Scope } from "@replayio/protocol";

import { getObjectWithPreviewSuspense } from "replay-next/src/suspense/ObjectPreviews";
import { evaluateSuspense } from "replay-next/src/suspense/PauseCache";
import { getFrameScopesSuspense } from "replay-next/src/suspense/ScopeCache";
import { ReplayClientInterface } from "shared/client/types";

import findMatchingScopesAndProperties from "./findMatchingScopesAndProperties";
import { Match } from "./types";

// The legacy auto-complete allowed property previews to overflow.
// This meant we only got a couple of them, which was only of limited use.
// Let's try not allowing overflow and we can disable it if it's too slow.
const PREVIEW_CAN_OVERFLOW = false;

const MAX_PROTOTYPE_DEPTH = 10;

export default function findMatches(
  query: string,
  queryScope: string | null,
  replayClient: ReplayClientInterface,
  frameId: FrameId | null,
  pauseId: PauseId | null
): Match[] {
  // Remove leading "."
  query = query.slice(1);

  if (query === "" && queryScope === "") {
    return [];
  }

  const { properties, scopes } = fetchQueryData(replayClient, queryScope, frameId, pauseId);

  return findMatchingScopesAndProperties(queryScope, query, scopes, properties) || [];
}

function fetchQueryData(
  replayClient: ReplayClientInterface,
  queryScope: string | null,
  frameId: FrameId | null,
  pauseId: PauseId | null
): {
  properties: Property[] | null;
  scopes: Scope[] | null;
} {
  let properties: Property[] | null = null;

  let scopes = null;
  if (frameId && pauseId) {
    scopes = getFrameScopesSuspense(replayClient, pauseId, frameId)?.generatedScopes || null;
  }

  if (pauseId) {
    if (queryScope) {
      // Evaluate the properties of an object (queryScope)
      const maybeObjectId = evaluateSuspense(replayClient, pauseId, frameId, queryScope)?.returned
        ?.object;
      if (maybeObjectId) {
        const { preview } = getObjectWithPreviewSuspense(
          replayClient,
          pauseId,
          maybeObjectId,
          !PREVIEW_CAN_OVERFLOW
        );
        properties = preview?.properties || null;

        // Auto-complete should not just include own properties.
        // If there's a prototype chain, fetch those properties also.
        let currentPrototypeId = preview?.prototypeId;
        let depth = 0;
        while (currentPrototypeId && depth < MAX_PROTOTYPE_DEPTH) {
          const { preview: prototypePreview } = getObjectWithPreviewSuspense(
            replayClient,
            pauseId,
            currentPrototypeId,
            !PREVIEW_CAN_OVERFLOW
          );
          properties = properties ? properties.concat(prototypePreview?.properties || []) : [];
          currentPrototypeId = prototypePreview?.prototypeId;
          depth++;
        }
      }
    } else {
      // Evaluate the properties of the global/window object
      if (scopes && scopes.length > 0) {
        const maybeGlobalObjectId = scopes[scopes.length - 1]?.object;
        if (maybeGlobalObjectId) {
          const { preview } = getObjectWithPreviewSuspense(
            replayClient,
            pauseId,
            maybeGlobalObjectId,
            !PREVIEW_CAN_OVERFLOW
          );
          properties = preview?.properties || null;
        }
      }
    }
  }

  return { properties, scopes };
}
