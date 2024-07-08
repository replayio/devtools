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
import {
  DependencyChainStep,
  DependencyGraphMode,
  ReplayClientInterface,
} from "shared/client/types";
import { formatFunctionDetailsFromLocation } from "ui/actions/eventListeners/eventListenerUtils";
import { findFunctionOutlineForLocation } from "ui/actions/eventListeners/jumpToCode";

import { formattedPointStackCache } from "./frameCache";

export const depGraphCache: Cache<
  [
    replayClient: ReplayClientInterface,
    point: ExecutionPoint | null,
    mode: DependencyGraphMode | null
  ],
  DependencyChainStep[] | null
> = createCache({
  config: { immutable: true },
  debugLabel: "depGraphCache",
  getKey: ([replayClient, point, mode]) => `${point ?? "null"}:${mode ?? "none"}`,
  load: async ([replayClient, point, mode]) => {
    if (!point) {
      return null;
    }
    const dependencies = await replayClient.getDependencies(point, mode ?? undefined);

    console.log("Deps for point: ", point, dependencies);
    return dependencies;
  },
});

interface ReactComponentStackEntry extends TimeStampedPoint {
  parentLocation: Location & { url: string };
  componentName: string;
}

export const REACT_DOM_SOURCE_URLS = [
  // React 18 and earlier
  "react-dom.",
  // React 19
  "react-dom-client.",
];

export const isReactUrl = (url?: string) =>
  REACT_DOM_SOURCE_URLS.some(partial => url?.includes(partial));

export const reactComponentStackCache: Cache<
  [replayClient: ReplayClientInterface, point: TimeStampedPoint | null],
  ReactComponentStackEntry[] | null
> = createCache({
  config: { immutable: true },
  debugLabel: "reactComponentStackCache",
  getKey: ([replayClient, point]) => point?.point ?? "null",
  load: async ([replayClient, point]) => {
    if (!point) {
      return null;
    }

    const currentPointStack = await formattedPointStackCache.readAsync(
      replayClient,
      {
        ...point,
        frameDepth: 2,
      },
      []
    );

    console.log("Point stack for point: ", point, currentPointStack);

    const precedingFrame = currentPointStack.allFrames[1];

    if (!isReactUrl(precedingFrame?.url)) {
      return null;
    }

    const originalDependencies = await depGraphCache.readAsync(replayClient, point.point, null);
    const reactDependencies = await depGraphCache.readAsync(
      replayClient,
      point.point,
      DependencyGraphMode.ReactParentRenders
    );

    console.log("Deps: ", { originalDependencies, reactDependencies });

    if (!originalDependencies || !reactDependencies) {
      return null;
    }

    const componentStack: ReactComponentStackEntry[] = [];

    const sourcesById = await sourcesByIdCache.readAsync(replayClient);

    const remainingDepEntries = reactDependencies.slice().reverse();
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
