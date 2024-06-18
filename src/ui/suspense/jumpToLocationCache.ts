import {
  ExecutionPoint,
  FunctionMatch,
  FunctionOutline,
  Location,
  PointDescription,
  SourceLocationRange,
} from "@replayio/protocol";
import { createCache, createSingleEntryCache } from "suspense";

import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";
import { IGNORABLE_PARTIAL_SOURCE_URLS } from "ui/actions/eventListeners/eventListenerUtils";
import { findFunctionOutlineForLocation } from "ui/actions/eventListeners/jumpToCode";
import { FormattedPointStackFrame, formattedPointStackCache } from "ui/suspense/frameCache";

interface FunctionBoundaries {
  location: SourceLocationRange;
  sourceId: string;
}

export const reduxStoreDetailsCache = createSingleEntryCache<
  [replayClient: ReplayClientInterface],
  FunctionBoundaries[] | null
>({
  debugLabel: "ReduxStoreDetails",
  load: async ([replayClient]) => {
    const sourcesById = await sourcesByIdCache.readAsync(replayClient);

    const reduxSources = Array.from(sourcesById.values()).filter(
      source => source.url?.includes("/redux/") && source.isSourceMapped
    );

    if (reduxSources.length === 0) {
      return null;
    }

    const replaceReducerMatches: FunctionMatch[] = [];
    await replayClient.searchFunctions(
      // This is a good function to look for to find the actual `createStore` method
      { query: "replaceReducer", sourceIds: reduxSources.map(source => source.id) },
      matches => {
        replaceReducerMatches.push(...matches);
      }
    );

    if (replaceReducerMatches.length === 0) {
      return null;
    }

    // Find _all_ `applyMiddleware` definitions across whatever original or pretty-printed
    // versions of `redux.js` we have.
    const applyMiddlewareLocations: FunctionBoundaries[] = (
      await Promise.all(
        replaceReducerMatches.map(async m => {
          const sourceOutline = await sourceOutlineCache.readAsync(replayClient, m.loc.sourceId);
          const applyMiddlewareFunction = sourceOutline.functions.find(
            o => o.name === "applyMiddleware"
          );

          if (!applyMiddlewareFunction) {
            return null;
          }

          return {
            sourceId: m.loc.sourceId,
            location: applyMiddlewareFunction.location,
          };
        })
      )
    ).filter(Boolean);

    if (applyMiddlewareLocations.length === 0) {
      return null;
    }

    return applyMiddlewareLocations;
  },
});

function isFrameInDecl(functions: FunctionBoundaries[], frame: FormattedPointStackFrame) {
  // Check to see if the frame is inside any of the listed function definitions
  return functions.some(decl => {
    return (
      frame.executionLocation.line >= decl.location.begin.line &&
      frame.executionLocation.line < decl.location.end.line &&
      frame.executionLocation.sourceId === decl.sourceId
    );
  });
}

function isNestedInside(child: SourceLocationRange, parent: SourceLocationRange) {
  const startsBefore =
    parent.begin.line < child.begin.line ||
    (parent.begin.line === child.begin.line && parent.begin.column <= child.begin.column);
  const endsAfter =
    parent.end.line > child.end.line ||
    (parent.end.line === child.end.line && parent.end.column >= child.end.column);

  return startsBefore && endsAfter;
}

async function findLikelyAppDispatchFrame(
  pauseFrames: FormattedPointStackFrame[],
  replayClient: ReplayClientInterface
) {
  const applyMiddlewareLocations = await reduxStoreDetailsCache.readAsync(replayClient);

  if (!applyMiddlewareLocations) {
    return null;
  }

  // The first 2 elements in filtered pause frames are from replay's redux stub, so they should be ignored
  // The 3rd element is the user function that calls it, and will most likely be the `dispatch` call
  const framesWithoutReplayStub = pauseFrames.slice(2);

  for (const frame of framesWithoutReplayStub) {
    // console.log("Checking middleware status: ", frame);
    const isMiddleware = await isReduxMiddleware(replayClient, frame.executionLocation);
    if (isMiddleware) {
      continue;
    }

    if (isFrameInDecl(applyMiddlewareLocations, frame)) {
      // this is the frame inside `applyMiddleware` where the initial dispatch occurs
      // the frame just before this one is the user `dispatch`
      continue;
    }

    // Return the first frame that is _not_ a middleware or `applyMiddleware`
    return frame;
  }

  return null;
}

// Check for all the functions before the fnIndex in the array
// and find the one that wraps the function at fnIndex
export function findFunctionParent(functions: FunctionOutline[], fnIndex: number) {
  for (let i = fnIndex - 1; i >= 0; i--) {
    let maybeParentFn = functions[i];

    if (isNestedInside(functions[fnIndex].location, maybeParentFn.location)) {
      return maybeParentFn;
    }
  }

  return null;
}

async function isReduxMiddleware(replayClient: ReplayClientInterface, location: Location) {
  const sourceOutline = await sourceOutlineCache.readAsync(replayClient, location.sourceId);
  const dispatchFn = findFunctionOutlineForLocation(location, sourceOutline);
  const functions = sourceOutline.functions;

  if (dispatchFn && dispatchFn.parameters.length === 1) {
    const index = functions.indexOf(dispatchFn);
    if (index >= 2) {
      const wrapDispatchFn = findFunctionParent(functions, index);

      if (wrapDispatchFn) {
        const middlewareFn = findFunctionParent(functions, functions.indexOf(wrapDispatchFn));
        if (middlewareFn) {
          if (
            wrapDispatchFn.parameters.length === 1 &&
            middlewareFn.parameters.length <= 1 &&
            isNestedInside(dispatchFn.location, wrapDispatchFn.location) &&
            isNestedInside(wrapDispatchFn.location, middlewareFn.location)
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

export const reduxDispatchJumpLocationCache = createCache<
  [replayClient: ReplayClientInterface, point: ExecutionPoint, time: number],
  PointDescription | undefined
>({
  config: { immutable: true },
  debugLabel: "ReduxDispatchJumpLocation",
  getKey: ([replayClient, point, time]) => point,
  load: async ([replayClient, point, time]) => {
    const frames = await formattedPointStackCache.readAsync(
      replayClient,
      { point, time },
      IGNORABLE_PARTIAL_SOURCE_URLS.concat(
        "serializableStateInvariantMiddleware",
        "immutableStateInvariantMiddleware",
        "redux-thunk",
        "bindActionCreators"
      )
    );
    const { filteredFrames: filteredPauseFrames } = frames;

    const possibleDispatchFrame = await findLikelyAppDispatchFrame(
      filteredPauseFrames,
      replayClient
    );

    return possibleDispatchFrame?.point;
  },
});
