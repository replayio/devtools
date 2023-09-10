import {
  ClassOutline,
  ExecutionPoint,
  FunctionOutline,
  Location,
  PointDescription,
  SourceLocation,
  TimeStampedPoint,
  getSourceOutlineResult,
} from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import { getThreadContext } from "devtools/client/debugger/src/reducers/pause";
import type { ThreadFront as TF } from "protocol/thread";
import { RecordingTarget, recordingTargetCache } from "replay-next/src/suspense/BuildIdCache";
import { eventCountsCache, eventPointsCache } from "replay-next/src/suspense/EventsCache";
import { topFrameCache } from "replay-next/src/suspense/FrameCache";
import { hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseEvaluationsCache, pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { isLocationBefore } from "replay-next/src/utils/source";
import { ReplayClientInterface } from "shared/client/types";
import type { UIThunkAction } from "ui/actions";
import { InteractionEventKind } from "ui/actions/eventListeners/constants";
import {
  formatEventListener,
  isFunctionPreview,
  shouldIgnoreEventFromSource,
} from "ui/actions/eventListeners/eventListenerUtils";
import { setViewMode } from "ui/actions/layout";
import { JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { getViewMode } from "ui/reducers/layout";
import { SourcesState, getPreferredLocation, getSourceDetailsEntities } from "ui/reducers/sources";
import { UIState } from "ui/state";
import { ParsedJumpToCodeAnnotation } from "ui/suspense/annotationsCaches";

import { createReactEventMapper } from "./evaluationMappers";

export interface PointWithEventType extends TimeStampedPoint {
  kind: "keypress" | "mousedown";
}

type EventCategories = "Mouse" | "Keyboard";

export interface EventListenerEntry {
  eventType: string;
  categoryKey: EventCategories;
}

const EVENTS_FOR_RECORDING_TARGET: Partial<
  Record<RecordingTarget, Record<InteractionEventKind, EventListenerEntry>>
> = {
  gecko: {
    mousedown: { categoryKey: "Mouse", eventType: "event.mouse.click" },
    keypress: { categoryKey: "Keyboard", eventType: "event.keyboard.keypress" },
  },
  chromium: {
    mousedown: { categoryKey: "Mouse", eventType: "click" },
    keypress: { categoryKey: "Keyboard", eventType: "keypress" },
  },
};
const USER_INTERACTION_IGNORABLE_URLS = [
  // _Never_ treat Cypress events as user interactions
  "__cypress/runner/",
];

export const nextInteractionEventCache: Cache<
  [
    replayClient: ReplayClientInterface,
    ThreadFront: typeof TF,
    point: ExecutionPoint,
    end: TimeStampedPoint,
    replayEventType: InteractionEventKind,
    sourcesState: SourcesState
  ],
  PointDescription | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "NextInteractionEvent",
  getKey: ([replayClient, threadFront, point, end, replayEventType]) => point,
  load: async ([replayClient, threadFront, point, end, replayEventType, sourcesState]) => {
    const recordingTarget = await recordingTargetCache.readAsync(replayClient);

    // Limit to browsers
    if (!["gecko", "chromium"].includes(recordingTarget)) {
      return;
    }

    let eventTypesToQuery: string[] = [];

    const initialEventType = EVENTS_FOR_RECORDING_TARGET[recordingTarget]?.[replayEventType];

    if (!initialEventType) {
      return;
    }

    if (recordingTarget === "gecko") {
      // For Firefox, we can use that event string as-is
      eventTypesToQuery.push(initialEventType.eventType);
    } else if (recordingTarget === "chromium") {
      // Now we get to do this the hard way.
      // Chromium sends back a bunch of different types of events.  For example, a "click" event
      // could be `"click,DIV"`, `"click,BUTTON"`, `"click,BODY"`, etc.
      // We apparently need to add _all_ of those to this analysis for it to work.
      const eventCounts = await eventCountsCache.readAsync(replayClient, null);

      const categoryEntry = eventCounts.find(e => e.category === initialEventType.categoryKey);
      if (!categoryEntry) {
        return;
      }
      const eventsForType = categoryEntry.events.find(e => e.label === initialEventType.eventType);
      if (!eventsForType) {
        return;
      }
      eventTypesToQuery = eventsForType.rawEventTypes;
    }

    if (!eventTypesToQuery.length) {
      return;
    }

    const entryPoints = await eventPointsCache.readAsync(
      BigInt(point),
      BigInt(end.point),
      replayClient,
      eventTypesToQuery
    );

    const firstSuitableHandledEvent = entryPoints.find(ep => {
      if (ep.frame?.length) {
        const preferredLocation = getPreferredLocation(sourcesState, ep.frame);
        const matchingSource = sourcesState.sourceDetails.entities[preferredLocation.sourceId];

        // Find the first event that seems useful to jump to
        return !shouldIgnoreEventFromSource(matchingSource, USER_INTERACTION_IGNORABLE_URLS);
      }
    });
    return firstSuitableHandledEvent;
  },
});

/*
Jump to the function location that ran for a given info sidebar event list item,
such as "Click" or "Key Press: L"

This requires stringing together a series of assumptions and special cases:

- The info sidebar "Click" events come from `Session.findMouseEvents`, and keyboard events
  from `Session.findKeyboardEvents`
  These events are recorded in our browser forks _before_ any actual JS code runs.
- However, we can assume that a _real_ "user interaction event" such as 
  `"click"` or `"keypress"` event occurs shortly thereafter.
- We can find that event based on a timeboxed search, with the initial sidebar event time
  as the starting point.
- We can use the interaction event's stack frame to know the location of the JS event handler
  that started running in response to the event. _However_, React attaches noop handlers,
  and implements its own event listener lookups at the top level (delegation).
- Fortunately, React 16/17/18 add a secret expando property to DOM nodes, containing 
  the actual props that the user rendered for that DOM node, such as `onClick`.
- All interaction events will have a JS event object such as `MouseEvent`or `InputEvent`
   as one of their arguments
- Once we find the event object, we can look at `event.target` to find the clicked node
- But, the _target_ may not have had the handler due to delegation - the user-provided
  React handler prop may have been on an ancestor DOM node instead.
- So, we can walk up the parent node chain and find the first node that has a React
  handler prop with a relevant name attached to it, if any, and return that
- In order to optimize the API calls and network traffic, that parent node traversal
  is done via a single JS evaluation, which returns `{target, handlerProp?}`.
- If we found a React event handler prop in the chain, jump to that location. Otherwise,
  jump to the location of the plain JS event handler in the stack frame.

We _could_ do more analysis and find the nearest time where the first breakable location
inside that function is running, then seek to that point in time, but skipping for now.
*/
export function jumpToClickEventFunctionLocation(
  onSeek: (point: ExecutionPoint, time: number) => void,
  event: PointWithEventType,
  end?: TimeStampedPoint
): UIThunkAction<Promise<JumpToCodeStatus>> {
  return async (dispatch, getState, { ThreadFront, replayClient }) => {
    const { point: executionPoint, time } = event;
    const sourcesState = getState().sources;

    try {
      // Actual browser click events get recorded a fraction later then the
      // "mouse events" used by the sidebar.
      // Look for the next click event within a short timeframe after the "mouse event".
      // Yes, this is hacky, but it does seem pretty consistent.
      if (!end) {
        const arbitraryEndTime = time + 500;
        const pointNearEndTime = await replayClient.getPointNearTime(arbitraryEndTime);
        end = pointNearEndTime;
      }
      const actualEnd = end!;

      const focusWindow = replayClient.getCurrentFocusWindow();

      // Safety check: don't ask for points if this time isn't loaded
      const isEndTimeInLoadedRegion =
        focusWindow != null &&
        focusWindow.begin.time <= actualEnd.time &&
        focusWindow.end.time >= actualEnd.time;

      if (!isEndTimeInLoadedRegion) {
        return "not_focused";
      }

      // Go ahead and ensure that we're on DevTools mode right away,
      // even before we know if there's a valid location to jump to
      if (getViewMode(getState()) !== "dev") {
        dispatch(setViewMode("dev"));
      }

      // The sidebar event time/point is a fraction earlier than any
      // actual JS that executed in response. Find the next click event
      // within a small time window
      const nextClickEvent = await nextInteractionEventCache.readAsync(
        replayClient,
        ThreadFront,
        executionPoint,
        actualEnd,
        event.kind as InteractionEventKind,
        sourcesState
      );

      if (!nextClickEvent) {
        return "no_hits";
      }

      const pauseId = await pauseIdCache.readAsync(
        replayClient,
        nextClickEvent.point,
        nextClickEvent.time
      );

      const functionSourceLocation = await eventListenerLocationCache.readAsync(
        ThreadFront,
        replayClient,
        getState,
        pauseId,
        event.kind as InteractionEventKind
      );

      if (functionSourceLocation) {
        const symbols = await sourceOutlineCache.readAsync(
          replayClient,
          functionSourceLocation.sourceId
        );

        const functionOutline = findFunctionOutlineForLocation(functionSourceLocation, symbols);

        const cx = getThreadContext(getState());

        const nextBreakablePosition: Location | null = functionOutline?.breakpointLocation
          ? {
              ...functionOutline?.breakpointLocation,
              sourceId: functionSourceLocation.sourceId,
            }
          : null;
        const locationToOpen = nextBreakablePosition ?? functionSourceLocation;

        // Open the source file and jump to the found position.
        // This is either the function definition itself, or the first position _inside_ the function.
        dispatch(selectLocation(cx, locationToOpen));

        if (nextBreakablePosition) {
          // We think we know the first position _inside_ the function.
          // Run analysis to find the next time this position got hit.
          const [hitPoints] = await hitPointsForLocationCache.readAsync(
            replayClient,
            { begin: executionPoint, end: end.point },
            nextBreakablePosition,
            null
          );

          const [firstHitPoint] = hitPoints;
          if (firstHitPoint) {
            // Assuming the position got hit, timewarp to that exact time.
            // This should put the execution line+time inside the function,
            // where the actual event listener logic is executing.
            onSeek(firstHitPoint.point, firstHitPoint.time);
          }
        }
        return "found";
      } else {
        return "no_hits";
      }
    } catch (err) {
      // Let's just swallow this silently for now
    }

    return "no_hits";
  };
}

// TODO This cache looks unsafe because it's not idempotent;
// it accepts a state getter function but does not reflect the state it reads as part of the cache key.
export const eventListenerLocationCache: Cache<
  [
    ThreadFront: typeof TF,
    replayClient: ReplayClientInterface,
    getState: () => UIState,
    pauseId: string,
    replayEventType: InteractionEventKind
  ],
  Location | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "EventListenerLocation",
  getKey: ([threadFront, replayClient, getState, pauseId, replayEventType]) =>
    `${pauseId}:${replayEventType}`,
  load: async ([threadFront, replayClient, getState, pauseId, replayEventType]) => {
    const topFrame = await topFrameCache.readAsync(replayClient, pauseId);

    if (!topFrame) {
      return;
    }
    const { frameId } = topFrame;

    await sourcesCache.readAsync(replayClient);

    const state = getState();

    const evaluatedEventMapper = createReactEventMapper(replayEventType);

    // Introspect the event's target DOM node, and find the nearest
    // React event handler if any exists.
    const res = await pauseEvaluationsCache.readAsync(
      replayClient,
      pauseId,
      frameId,
      evaluatedEventMapper
    );

    let sourceLocation: Location | undefined;
    const sourcesById = getSourceDetailsEntities(state);

    if (res.returned?.object) {
      const preview = await objectCache.readAsync(
        replayClient,
        pauseId,
        res.returned.object,
        "canOverflow"
      );
      // The evaluation may have found a React prop function somewhere.
      const handlerProp = preview?.preview?.properties?.find(p => p.name === "handlerProp");

      if (handlerProp) {
        // If it did find a React prop function, get its
        // preview and format it so we know the preferred location.
        const onClickPreview = await objectCache.readAsync(
          replayClient,
          pauseId,
          handlerProp.object!,
          "full"
        );

        // As of RUN-1709 Chromium _should_ be sending back previews with function locations,
        // but doesn't hurt to double-check.
        if (!onClickPreview || !isFunctionPreview(onClickPreview.preview)) {
          return undefined;
        }

        const formattedEventListener = await formatEventListener(
          replayClient,
          replayEventType,
          onClickPreview.preview,
          "react"
        );

        sourceLocation = formattedEventListener?.location;
      }
    } else if (res.exception?.object) {
      const error = await objectCache.readAsync(
        replayClient,
        pauseId,
        res.exception.object,
        "canOverflow"
      );
      console.error("Error fetching event listener location: ", error);
    }

    if (!sourceLocation) {
      // Otherwise, use the location from the actual JS event handler.
      sourceLocation = getPreferredLocation(state.sources, topFrame.location);
      const sourceDetails = sourcesById[sourceLocation.sourceId];

      if (shouldIgnoreEventFromSource(sourceDetails)) {
        // Intentionally _don't_ jump to into specific ignorable libraries, like React
        sourceLocation = undefined;
      }
    }

    return sourceLocation!;
  },
});

export function findFunctionOutlineForLocation(
  location: SourceLocation,
  sourceOutline: getSourceOutlineResult
): FunctionOutline | undefined {
  let foundFunctionOutline: FunctionOutline | undefined = undefined;
  let foundFunctionBegin: SourceLocation | undefined;

  for (const functionOutline of sourceOutline.functions) {
    const functionBegin = functionOutline.location.begin;
    const functionEnd = functionOutline.location.end;

    const functionIsBeforeLocation = isLocationBefore(functionBegin, location);
    const locationIsBeforeEnd = isLocationBefore(location, functionEnd);

    const functionIsCloserThanFoundFunction =
      !foundFunctionBegin || isLocationBefore(foundFunctionBegin, functionBegin);

    const isMatch =
      functionIsBeforeLocation && locationIsBeforeEnd && functionIsCloserThanFoundFunction;

    if (isMatch) {
      foundFunctionBegin = functionBegin;
      foundFunctionOutline = functionOutline;
    }
  }
  return foundFunctionOutline;
}

export function findClassOutlineForLocation(
  location: SourceLocation,
  sourceOutline: getSourceOutlineResult
): ClassOutline | undefined {
  let foundClassOutline: ClassOutline | undefined = undefined;
  let foundFunctionBegin: SourceLocation | undefined;

  for (const classOutline of sourceOutline.classes) {
    const functionBegin = classOutline.location.begin;
    const functionEnd = classOutline.location.end;

    const functionIsBeforeLocation = isLocationBefore(functionBegin, location);
    const locationIsBeforeEnd = isLocationBefore(location, functionEnd);

    const functionIsCloserThanFoundFunction =
      !foundFunctionBegin || isLocationBefore(foundFunctionBegin, functionBegin);

    const isMatch =
      functionIsBeforeLocation && locationIsBeforeEnd && functionIsCloserThanFoundFunction;

    if (isMatch) {
      foundFunctionBegin = functionBegin;
      foundClassOutline = classOutline;
    }
  }
  return foundClassOutline;
}

export function jumpToKnownEventListenerHit(
  onSeek: (point: ExecutionPoint, time: number) => void,
  jumpToCodeDetails: ParsedJumpToCodeAnnotation
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const cx = getThreadContext(getState());

    const { eventListener, listenerPoint } = jumpToCodeDetails;
    const { location, firstBreakablePosition } = eventListener;

    // Open the source file and jump to the found position.
    // This is either the function definition itself, or the first position _inside_ the function.
    dispatch(selectLocation(cx, firstBreakablePosition));
    onSeek(listenerPoint.point, listenerPoint.time);
  };
}
