import { ExecutionPoint, Location, TimeStampedPoint } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { Source, sourcesByIdCache, sourcesByUrlCache } from "replay-next/src/suspense/SourcesCache";
import { getSourceToDisplayForUrl } from "replay-next/src/utils/sources";
import {
  DependencyChainStep,
  DependencyGraphMode,
  ReplayClientInterface,
  URLLocation,
} from "shared/client/types";
import { formatFunctionDetailsFromLocation } from "ui/actions/eventListeners/eventListenerUtils";

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

    return dependencies;
  },
});

interface LocationWithUrl extends Location {
  url: string;
}

interface ReactComponentStackEntry extends TimeStampedPoint {
  parentLocation: LocationWithUrl | null;
  componentLocation: LocationWithUrl | null;
  componentName: string;
  parentComponentName: string;
}

export const REACT_DOM_SOURCE_URLS = [
  // React 18 and earlier
  "react-dom.",
  // React 19
  "react-dom-client.",
];

export const isReactUrl = (url?: string) =>
  REACT_DOM_SOURCE_URLS.some(partial => url?.includes(partial));

const pairwise = <T>(arr: T[]): [T, T][] => {
  const pairs: [T, T][] = [];
  for (let i = 0; i < arr.length - 1; i++) {
    pairs.push([arr[i], arr[i + 1]]);
  }
  return pairs;
};

interface RenderCreateElementPair {
  render: {
    // React has rendered a component.
    code: "ReactRender";
    calleeLocation?: URLLocation;
  } & TimeStampedPoint;
  createElement: {
    // An application render function created an element object for converting
    // into a component.
    code: "ReactCreateElement";
  } & TimeStampedPoint;
}

async function getComponentDetails(
  replayClient: ReplayClientInterface,
  location: URLLocation | undefined,
  sourcesById: Map<string, Source>
): Promise<{ componentName: string; location: LocationWithUrl | null }> {
  let componentName = "Unknown";
  let finalLocation: LocationWithUrl | null = null;

  if (location) {
    const sourcesByUrl = await sourcesByUrlCache.readAsync(replayClient);

    const bestSource = getSourceToDisplayForUrl(sourcesById, sourcesByUrl, location.url);

    if (bestSource) {
      const locationInFunction: Location = {
        sourceId: bestSource.sourceId,
        line: location.line,
        column: location.column,
      };
      finalLocation = {
        ...locationInFunction,
        url: location.url,
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
    }
  }

  return {
    componentName,
    location: finalLocation,
  };
}

async function formatComponentStackEntry(
  replayClient: ReplayClientInterface,
  sourcesById: Map<string, Source>,
  currentComponent: RenderCreateElementPair,
  parentComponent: RenderCreateElementPair
): Promise<ReactComponentStackEntry | null> {
  const elementCreationPoint = currentComponent.createElement;
  const componentLocation = currentComponent.render.calleeLocation;
  const parentLocation = parentComponent.render.calleeLocation;

  if (!componentLocation || !parentLocation) {
    return null;
  }

  const [componentDetails, parentComponentDetails] = await Promise.all([
    getComponentDetails(replayClient, componentLocation, sourcesById),
    getComponentDetails(replayClient, parentLocation, sourcesById),
  ]);

  const pointStack = await formattedPointStackCache.readAsync(replayClient, {
    ...elementCreationPoint,
    frameDepth: 2,
  });

  let finalJumpPoint: TimeStampedPoint = elementCreationPoint;

  if (pointStack.allFrames.length > 1) {
    // Element creation happens up one frame
    const elementCreationFrame = pointStack.allFrames[1];
    finalJumpPoint = elementCreationFrame.point!;
  }

  const stackEntry: ReactComponentStackEntry = {
    ...finalJumpPoint,
    parentLocation: parentComponentDetails.location,
    componentLocation: componentDetails.location,
    componentName: componentDetails.componentName,
    parentComponentName: parentComponentDetails.componentName,
  };

  return stackEntry;
}

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
      // don't ignore any files, we _want_ `node_modules` here
      []
    );

    const precedingFrame = currentPointStack.allFrames[1];

    // We expect that if we're currently rendering a React component,
    // the parent frame is either `renderWithHooks()` or
    // `finishClassComponent()`. For now we'll just check if the
    // preceding frame is at least in a React build artifact.
    // If not, there's no point in trying to build a component stack.
    if (!isReactUrl(precedingFrame?.url)) {
      return null;
    }

    const originalDependencies = await depGraphCache.readAsync(replayClient, point.point, null);
    const reactDependencies = await depGraphCache.readAsync(
      replayClient,
      point.point,
      DependencyGraphMode.ReactParentRenders
    );

    if (!originalDependencies || !reactDependencies) {
      return null;
    }

    const componentStack: ReactComponentStackEntry[] = [];

    const sourcesById = await sourcesByIdCache.readAsync(replayClient);

    const remainingDepEntries = reactDependencies.slice().reverse();

    const renderPairs: RenderCreateElementPair[] = [];

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

        const renderPair = {
          render: depEntry,
          createElement: previousEntry as {
            code: "ReactCreateElement";
          },
        } as RenderCreateElementPair;

        renderPairs.push(renderPair);
      }
    }

    const renderPairsWithParents = pairwise(renderPairs);

    for (const [current, parent] of renderPairsWithParents) {
      const stackEntry = await formatComponentStackEntry(
        replayClient,
        sourcesById,
        current,
        parent
      );

      if (stackEntry) {
        componentStack.push(stackEntry);
      }
    }

    return componentStack;
  },
});
