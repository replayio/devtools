import {
  ExecutionPoint,
  FunctionMatch,
  FunctionOutline,
  Location,
  PointDescription,
  SourceLocationRange,
} from "@replayio/protocol";
import { createSingleEntryCache } from "suspense";
import { createCacheWithTelemetry } from "replay-next/src/utils/suspense"

import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { getPreferredLocation } from "replay-next/src/utils/sources";
import { ReplayClientInterface } from "shared/client/types";
import { IGNORABLE_PARTIAL_SOURCE_URLS } from "ui/actions/eventListeners/eventListenerUtils";
import { findFunctionOutlineForLocation } from "ui/actions/eventListeners/jumpToCode";
import { FormattedPointStackFrame, formattedPointStackCache } from "ui/suspense/frameCache";

interface ApplyMiddlewareDecl {
  location: SourceLocationRange;
  sourceId: string;
}

export const applyMiddlewareDeclCache = createSingleEntryCache<
  [replayClient: ReplayClientInterface],
  ApplyMiddlewareDecl | null
>({
  debugLabel: "ApplyMiddlewareDecl",
  load: async ([replayClient]) => {
    const dispatchMatches: FunctionMatch[] = [];

    const sourcesById = await sourcesByIdCache.readAsync(replayClient);
    const reduxSources = Array.from(sourcesById.values()).filter(source =>
      source.url?.includes("/redux/")
    );

    if (reduxSources.length === 0) {
      return null;
    }

    await replayClient.searchFunctions(
      { query: "dispatch", sourceIds: reduxSources.map(source => source.id) },
      matches => {
        dispatchMatches.push(...matches);
      }
    );

    const [firstMatch] = dispatchMatches;
    if (!firstMatch) {
      return null;
    }
    const preferredLocation = getPreferredLocation(sourcesById, [], [firstMatch.loc]);
    const reduxSource = sourcesById.get(preferredLocation.sourceId)!;
    const fileOutline = await sourceOutlineCache.readAsync(replayClient, reduxSource.id);

    const applyMiddlwareFunction = fileOutline.functions.find(o => o.name === "applyMiddleware")!;

    return {
      sourceId: reduxSource.sourceId,
      location: applyMiddlwareFunction.location,
    };
  },
});

function isFrameInDecl(decl: ApplyMiddlewareDecl, frame: FormattedPointStackFrame) {
  return (
    frame.executionLocation.line >= decl.location.begin.line &&
    frame.executionLocation.line < decl.location.end.line &&
    frame.executionLocation.sourceId === decl.sourceId
  );
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

async function searchingCallstackForDispatch(
  pauseFrames: FormattedPointStackFrame[],
  replayClient: ReplayClientInterface
) {
  // The first 2 elements in filtered pause frames are from replay's redux stub, so they should be ignored
  // The 3rd element is the user function that calls it, and will most likely be the `dispatch` call
  let preferredFrameIdx = 2;
  const applyMiddlewareDecl = await applyMiddlewareDeclCache.readAsync(replayClient);

  if (!applyMiddlewareDecl) {
    return null;
  }

  for (let frameIdx = 2; frameIdx < pauseFrames.length; frameIdx++) {
    const frame = pauseFrames[frameIdx];

    if (isFrameInDecl(applyMiddlewareDecl, frame)) {
      // this is the frame inside `applyMiddleware` where the initial dispatch occurs
      // the frame just before this one is the user `dispatch`
      preferredFrameIdx = frameIdx + 1;
      return preferredFrameIdx;
    }
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

async function searchSourceOutlineForDispatch(
  pauseFrames: FormattedPointStackFrame[],
  replayClient: ReplayClientInterface
) {
  // The first 2 elements in filtered pause frames are from replay's redux stub, so they should be ignored
  // The 3rd element is the user function that calls it, and will most likely be the `dispatch` call
  let preferredFrameIdx = 2;
  let isMiddleware = true;

  while (isMiddleware && preferredFrameIdx < pauseFrames.length) {
    let preferredFrame = pauseFrames[preferredFrameIdx];

    if (await isReduxMiddleware(replayClient, preferredFrame.executionLocation)) {
      isMiddleware = true;
      preferredFrameIdx++;
    } else {
      isMiddleware = false;
    }
  }

  return preferredFrameIdx;
}

export const reduxDispatchJumpLocationCache = createCacheWithTelemetry<
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

    let preferredFrameIdx = await searchingCallstackForDispatch(filteredPauseFrames, replayClient);

    if (preferredFrameIdx === null) {
      // couldn't find the frame through the call stack
      // now try finding a function in the call stack
      // that matches (store => next => action => {})
      preferredFrameIdx = await searchSourceOutlineForDispatch(filteredPauseFrames, replayClient);
    }

    return filteredPauseFrames[preferredFrameIdx].point;
  },
});
