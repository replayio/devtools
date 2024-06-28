import {
  ExecutionPoint,
  Frame,
  FunctionMatch,
  FunctionOutline,
  Location,
  PauseDescription,
  PauseId,
  PointDescription,
  PointStackFrame,
  RunEvaluationResult,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { sourcesByIdCache, sourcesByUrlCache } from "replay-next/src/suspense/SourcesCache";
import {
  getSourceIdToDisplayForUrl,
  getSourceToDisplayForUrl,
} from "replay-next/src/utils/sources";
import { DependencyChainStep, ReplayClientInterface } from "shared/client/types";
import { formatFunctionDetailsFromLocation } from "ui/actions/eventListeners/eventListenerUtils";
import { findFunctionOutlineForLocation } from "ui/actions/eventListeners/jumpToCode";

import { formattedPointStackCache } from "./frameCache";

export const depGraphCache: Cache<
  [replayClient: ReplayClientInterface, point: ExecutionPoint | null],
  DependencyChainStep[] | null
> = createCache({
  config: { immutable: true },
  debugLabel: "depGraphCache",
  getKey: ([replayClient, point]) => point ?? "null",
  load: async ([replayClient, point]) => {
    if (!point) {
      return null;
    }
    const dependencies = await replayClient.getDependencies(point);

    console.log("Deps for point: ", point, dependencies);
    return dependencies;
  },
});

interface ReactComponentStackEntry extends TimeStampedPoint {
  parentLocation: Location & { url: string };
  componentName: string;
}

export const reactComponentStackCache: Cache<
  [replayClient: ReplayClientInterface, point: ExecutionPoint | null],
  ReactComponentStackEntry[] | null
> = createCache({
  config: { immutable: true },
  debugLabel: "reactComponentStackCache",
  getKey: ([replayClient, point]) => point ?? "null",
  load: async ([replayClient, point]) => {
    const dependencies = await depGraphCache.readAsync(replayClient, point);

    if (!dependencies) {
      return null;
    }

    const componentStack: ReactComponentStackEntry[] = [];

    const sourcesById = await sourcesByIdCache.readAsync(replayClient);

    const remainingDepEntries = dependencies.slice().reverse();
    while (remainingDepEntries.length) {
      const depEntry = remainingDepEntries.shift()!;

      if (depEntry.code === "ReactRender") {
        const previousEntry = remainingDepEntries.shift();
        if (
          !previousEntry ||
          !["ReactCreateElement", "ReactReturnElement"].includes(previousEntry!.code)
        ) {
          console.error(
            "Expected ReactCreateElement or ReactReturnElement entry before ReactRender, got: ",
            previousEntry
          );
          continue;
        }

        if (!previousEntry.point) {
          console.error("Expected point in previous entry: ", previousEntry);
        }

        const elementCreationPoint: TimeStampedPoint = {
          point: previousEntry.point!,
          time: previousEntry.time!,
        };
        const parentLocation = depEntry.calleeLocation;

        let componentName = "Unknown";

        if (parentLocation) {
          const sourcesByUrl = await sourcesByUrlCache.readAsync(replayClient);
          const sourcesForUrl = sourcesByUrl.get(parentLocation.url);

          const bestSource = getSourceToDisplayForUrl(
            sourcesById,
            sourcesByUrl,
            parentLocation.url
          );

          if (!bestSource) {
            continue;
          }

          const locationInFunction: Location = {
            sourceId: bestSource.sourceId,
            line: parentLocation.line,
            column: parentLocation.column,
          };

          const formattedFunctionDescription = await formatFunctionDetailsFromLocation(
            replayClient,
            "component",
            locationInFunction,
            undefined,
            true
          );

          componentName =
            formattedFunctionDescription?.classComponentName ??
            formattedFunctionDescription?.functionName ??
            "Unknown";

          const pointStack = await formattedPointStackCache.readAsync(replayClient, {
            ...elementCreationPoint,
            frameDepth: 2,
          });

          let finalJumpPoint = elementCreationPoint;

          if (pointStack.allFrames.length > 1) {
            // Element creation happens up one frame
            const elementCreationFrame = pointStack.allFrames[1];
            finalJumpPoint = elementCreationFrame.point!;
          }

          const stackEntry: ReactComponentStackEntry = {
            ...finalJumpPoint,
            parentLocation: {
              ...locationInFunction,
              url: parentLocation.url,
            },
            componentName,
          };

          componentStack.push(stackEntry);
        }
      }
    }

    return componentStack;
  },
});
