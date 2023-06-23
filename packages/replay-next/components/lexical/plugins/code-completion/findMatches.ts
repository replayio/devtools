import {
  ExecutionPoint,
  FrameId,
  PauseId,
  Property,
  Scope,
  TimeStampedPointRange,
} from "@replayio/protocol";

import { getPauseAndFrameIdSuspends } from "replay-next/components/sources/utils/getPauseAndFrameId";
import { getFrameSuspense } from "replay-next/src/suspense/FrameCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseEvaluationsCache } from "replay-next/src/suspense/PauseCache";
import { frameScopesCache } from "replay-next/src/suspense/ScopeCache";
import { ReplayClientInterface } from "shared/client/types";

import findMatchingScopesAndProperties from "./findMatchingScopesAndProperties";
import { Match } from "./types";

export const MAX_DISTANCE = Number.MAX_SAFE_INTEGER;

export type WeightedProperty = Property & {
  distance: number;
};

export type Context = "console" | "logpoint-generated-source" | "logpoint-original-source";

// The legacy auto-complete allowed property previews to overflow.
// This meant we only got a couple of them, which was only of limited use.
// Let's try not allowing overflow and we can disable it if it's too slow.
const PREVIEW_CAN_OVERFLOW = false;

const MAX_PROTOTYPE_DEPTH = 10;

export default function findMatches(
  query: string,
  queryScope: string | null,
  replayClient: ReplayClientInterface,
  executionPoint: ExecutionPoint,
  time: number,
  focusWindow: TimeStampedPointRange | null,
  context: Context
): Match[] {
  // Remove leading "."
  query = query.slice(1);

  if (query === "" && queryScope === "") {
    return [];
  }

  const { properties, scopes } = fetchQueryData(
    replayClient,
    queryScope,
    executionPoint,
    time,
    focusWindow,
    context
  );

  return findMatchingScopesAndProperties(queryScope, query, scopes, properties) || [];
}

function fetchQueryData(
  replayClient: ReplayClientInterface,
  queryScope: string | null,
  executionPoint: ExecutionPoint,
  time: number,
  focusWindow: TimeStampedPointRange | null,
  context: Context
): {
  properties: WeightedProperty[] | null;
  scopes: Scope[] | null;
} {
  let properties: WeightedProperty[] | null = null;

  const pauseAndFrameId = getPauseAndFrameIdSuspends(
    replayClient,
    executionPoint,
    time,
    focusWindow,
    false
  );
  const frameId: FrameId | null = pauseAndFrameId?.frameId ?? null;
  const pauseId: PauseId | null = pauseAndFrameId?.pauseId ?? null;

  let frame = null;
  let generatedScopes: Scope[] | null = null;
  let scopes: Scope[] | null = null;
  if (frameId && pauseId) {
    frame = getFrameSuspense(replayClient, pauseId, frameId);

    const data = frameScopesCache.read(replayClient, pauseId, frameId);
    generatedScopes = data.generatedScopes;

    switch (context) {
      case "console":
        // People usually view original sources, but the Console doesn't know which mode they're using.
        // So try to show the original scopes if they're available, otherwise fall back to the generated scopes.
        scopes = data.originalScopes ?? generatedScopes;
        break;
      case "logpoint-generated-source":
        scopes = generatedScopes;
        break;
      case "logpoint-original-source":
        scopes = data.originalScopes ?? null;
        break;
    }
  }

  if (pauseId) {
    if (queryScope) {
      // Evaluate the properties of an object (queryScope)
      const maybeObjectId = pauseEvaluationsCache.read(
        replayClient,
        pauseId,
        frameId,
        queryScope,
        undefined
      )?.returned?.object;
      if (maybeObjectId) {
        const { preview } = objectCache.read(
          replayClient,
          pauseId,
          maybeObjectId,
          PREVIEW_CAN_OVERFLOW ? "canOverflow" : "full"
        );

        properties =
          preview?.properties?.map(property => ({
            ...property,
            distance: 0,
          })) ?? null;

        // Auto-complete should not just include own properties.
        // If there's a prototype chain, fetch those properties also.
        let currentPrototypeId = preview?.prototypeId;
        let depth = 0;
        while (currentPrototypeId && depth < MAX_PROTOTYPE_DEPTH) {
          const { preview: prototypePreview } = objectCache.read(
            replayClient,
            pauseId,
            currentPrototypeId,
            PREVIEW_CAN_OVERFLOW ? "canOverflow" : "full"
          );

          const weightedProperties: WeightedProperty[] =
            prototypePreview?.properties?.map(property => ({
              ...property,
              distance: depth + 1,
            })) ?? [];

          properties = properties ? properties.concat(weightedProperties) : weightedProperties;

          currentPrototypeId = prototypePreview?.prototypeId;
          depth++;
        }
      }
    } else {
      properties = [];

      if (frame?.this) {
        properties.push({
          distance: MAX_DISTANCE,
          name: "this",
        });
      }

      // There are certain keywords that are commonly used that won't be in the scope.
      // We should include them in the auto-complete.
      properties.push({
        distance: MAX_DISTANCE,
        name: "true",
      });
      properties.push({
        distance: MAX_DISTANCE,
        name: "false",
      });

      // Evaluate the properties of the global/window object
      if (generatedScopes && generatedScopes.length > 0) {
        const globalScope = generatedScopes.find(scope => scope.type === "global");
        if (globalScope?.object) {
          const { preview } = objectCache.read(
            replayClient,
            pauseId,
            globalScope.object,
            PREVIEW_CAN_OVERFLOW ? "canOverflow" : "full"
          );
          if (preview?.properties) {
            properties = properties.concat(
              preview.properties.map(property => ({
                ...property,
                distance: MAX_DISTANCE,
              }))
            );
          }
        }
      }
    }
  }

  return { properties, scopes };
}
