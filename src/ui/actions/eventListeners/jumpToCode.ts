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
import { RecordingTarget, recordingTargetCache } from "replay-next/src/suspense/BuildIdCache";
import { eventCountsCache, eventPointsCache } from "replay-next/src/suspense/EventsCache";
import { topFrameCache } from "replay-next/src/suspense/FrameCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseEvaluationsCache } from "replay-next/src/suspense/PauseCache";
import { sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { isLocationBefore } from "replay-next/src/utils/source";
import { ReplayClientInterface } from "shared/client/types";
import type { UIThunkAction } from "ui/actions";
import { InteractionEventKind } from "ui/actions/eventListeners/constants";
import {
  formatFunctionDetailsFromLocation,
  isFunctionPreview,
  shouldIgnoreEventFromSource,
} from "ui/actions/eventListeners/eventListenerUtils";
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
    point: ExecutionPoint,
    end: TimeStampedPoint,
    replayEventType: InteractionEventKind,
    sourcesState: SourcesState
  ],
  PointDescription | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "NextInteractionEvent",
  getKey: ([replayClient, point, end, replayEventType]) => point,
  load: async ([replayClient, point, end, replayEventType, sourcesState]) => {
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

// TODO This cache looks unsafe because it's not idempotent;
// it accepts a state getter function but does not reflect the state it reads as part of the cache key.
export const eventListenerLocationCache: Cache<
  [
    replayClient: ReplayClientInterface,
    getState: () => UIState,
    pauseId: string,
    replayEventType: InteractionEventKind
  ],
  Location | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "EventListenerLocation",
  getKey: ([replayClient, getState, pauseId, replayEventType]) => `${pauseId}:${replayEventType}`,
  load: async ([replayClient, getState, pauseId, replayEventType]) => {
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

        const formattedEventListener = await formatFunctionDetailsFromLocation(
          replayClient,
          replayEventType,
          onClickPreview.preview.functionLocation,
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
    // We sometimes seem to have a column off by one mismatch
    // between preview function locations and source outline
    // function locations, so we'll allow that.
    const functionBeginLooksSameLineAndCloseEnough =
      functionBegin.line === location.line && Math.abs(functionBegin.column - location.column) <= 1;
    const locationIsBeforeEnd = isLocationBefore(location, functionEnd);

    const functionIsCloserThanFoundFunction =
      !foundFunctionBegin || isLocationBefore(foundFunctionBegin, functionBegin);

    const isMatch =
      (functionIsBeforeLocation || functionBeginLooksSameLineAndCloseEnough) &&
      locationIsBeforeEnd &&
      functionIsCloserThanFoundFunction;

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
  onSeek: (point: ExecutionPoint, time: number, location: Location) => void,
  jumpToCodeDetails: ParsedJumpToCodeAnnotation
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const cx = getThreadContext(getState());

    const { eventListener, listenerPoint } = jumpToCodeDetails;
    const { location, firstBreakablePosition } = eventListener;

    // Open the source file and jump to the found position.
    // This is either the function definition itself, or the first position _inside_ the function.
    dispatch(selectLocation(cx, firstBreakablePosition));
    onSeek(listenerPoint.point, listenerPoint.time, location);
  };
}
