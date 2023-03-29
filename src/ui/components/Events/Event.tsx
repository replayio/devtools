import {
  ExecutionPoint,
  Location,
  KeyboardEvent as ReplayKeyboardEvent,
  MouseEvent as ReplayMouseEvent,
  SameLineSourceLocations,
  TimeStampedPoint,
} from "@replayio/protocol";
import classnames from "classnames";
import React, { ReactNode, useState } from "react";
import { Cache, createCache } from "suspense";

import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import { getThreadContext } from "devtools/client/debugger/src/reducers/pause";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { getFunctionBody } from "protocol/evaluation-utils";
import type { ThreadFront as TF } from "protocol/thread";
import { RecordingTarget } from "protocol/thread/thread";
import Icon from "replay-next/components/Icon";
import { useNag } from "replay-next/src/hooks/useNag";
import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { EventLog, eventsMapper } from "replay-next/src/suspense/EventsCache";
import { getHitPointsForLocationAsync } from "replay-next/src/suspense/HitPointsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { compareExecutionPoints } from "replay-next/src/utils/time";
import { ReplayClientInterface } from "shared/client/types";
import { Nag } from "shared/graphql/types";
import type { UIThunkAction } from "ui/actions";
import { SEARCHABLE_EVENT_TYPES, eventListenerLocationCache } from "ui/actions/event-listeners";
import { setViewMode } from "ui/actions/layout";
import useEventContextMenu from "ui/components/Events/useEventContextMenu";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { getLoadedRegions } from "ui/reducers/app";
import { getViewMode } from "ui/reducers/layout";
import { setMarkTimeStampPoint } from "ui/reducers/timeline";
import { useAppDispatch } from "ui/setup/hooks";
import { ReplayEvent } from "ui/state/app";

import MaterialIcon from "../shared/MaterialIcon";
import { getReplayEvent } from "./eventKinds";
import styles from "./Event.module.css";

export interface PointWithEventType extends TimeStampedPoint {
  kind: "keypress" | "mousedown";
}

const EVENTS_FOR_RECORDING_TARGET: Partial<
  Record<RecordingTarget, Record<SEARCHABLE_EVENT_TYPES, string>>
> = {
  gecko: {
    mousedown: "event.mouse.click",
    keypress: "event.keyboard.keypress",
  },
  // TODO [FE-1178] Fill in Chromium event types here?
  // chromium: {},
};

export const nextInteractionEventCache: Cache<
  [
    replayClient: ReplayClientInterface,
    ThreadFront: typeof TF,
    point: ExecutionPoint,
    replayEventType: SEARCHABLE_EVENT_TYPES,
    endTime: number
  ],
  EventLog | undefined
> = createCache({
  debugLabel: "NextInteractionEvent",
  getKey: ([replayClient, threadFront, point, replayEventType, endTime]) => point,
  load: async ([replayClient, threadFront, point, replayEventType, endTime]) => {
    const pointNearEndTime = await replayClient.getPointNearTime(endTime);

    const recordingTarget = await threadFront.getRecordingTarget();

    // Limit to browsers
    if (!["gecko", "chromium"].includes(recordingTarget)) {
      return;
    }

    const eventType = EVENTS_FOR_RECORDING_TARGET[recordingTarget]?.[replayEventType];

    if (!eventType) {
      return;
    }

    const entryPoints = await replayClient.runAnalysis<EventLog>({
      effectful: false,
      eventHandlerEntryPoints: [{ eventType }],
      mapper: getFunctionBody(eventsMapper),
      range: {
        begin: point,
        end: pointNearEndTime.point,
      },
    });

    entryPoints.sort((a, b) => compareExecutionPoints(a.point, b.point));
    return entryPoints[0];
  },
});

type EventProps = {
  currentTime: number;
  event: ReplayEvent;
  executionPoint: string;
  onSeek: (point: string, time: number) => void;
};

export const getEventLabel = (event: ReplayEvent) => {
  const { kind } = event;
  const { label } = getReplayEvent(kind);

  if (kind === "navigation") {
    const url = new URL(event.url);
    return <span title={event.url}>{url.host}</span>;
  }

  if ("key" in event) {
    return `${label} ${event.key}`;
  }

  return label;
};

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
  event: PointWithEventType,
  onSeek: (point: ExecutionPoint, time: number) => void
): UIThunkAction<Promise<JumpToCodeStatus>> {
  return async (dispatch, getState, { ThreadFront, replayClient }) => {
    const { point: executionPoint, time } = event;

    try {
      // Actual browser click events get recorded a fraction later then the
      // "mouse events" used by the sidebar.
      // Look for the next click event within a short timeframe after the "mouse event".
      // Yes, this is hacky, but it does seem pretty consistent.
      const arbitraryEndTime = time + 200;
      const loadedRegions = getLoadedRegions(getState());

      // Safety check: don't ask for points if this time isn't loaded
      const isEndTimeInLoadedRegion = loadedRegions?.loaded.some(
        region => region.begin.time <= arbitraryEndTime && region.end.time >= arbitraryEndTime
      );

      if (!isEndTimeInLoadedRegion) {
        return "not_loaded";
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
        event.kind as SEARCHABLE_EVENT_TYPES,
        arbitraryEndTime
      );

      if (!nextClickEvent) {
        return "no_hits";
      }

      const pauseId = await pauseIdCache.readAsync(
        replayClient,
        nextClickEvent.point,
        nextClickEvent.time
      );

      // If we did have a click event, timewarp to that click's point
      onSeek(nextClickEvent.point, nextClickEvent.time);

      const functionSourceLocation = await eventListenerLocationCache.readAsync(
        ThreadFront,
        replayClient,
        getState,
        pauseId,
        event.kind as SEARCHABLE_EVENT_TYPES
      );

      if (functionSourceLocation) {
        // TODO This sequence of logic could probably be cached too.
        // Not immediately critical, because the individual calls are cached.

        const [breakablePositions, breakablePositionsByLine] =
          await breakpointPositionsCache.readAsync(replayClient, functionSourceLocation.sourceId);

        // Since we're doing these checks without knowing the end of the function
        // (due to parsing concerns), let's find all breakable positions on this line and the next 2.
        const nextBreakablePosition = findFirstBreakablePositionForFunction(
          functionSourceLocation,
          breakablePositionsByLine
        );

        const cx = getThreadContext(getState());

        const locationToOpen = nextBreakablePosition ?? functionSourceLocation;

        // Open the source file and jump to the found position.
        // This is either the function definition itself, or the first position _inside_ the function.
        dispatch(selectLocation(cx, locationToOpen));

        if (nextBreakablePosition) {
          // We think we know the first position _inside_ the function.
          // Run analysis to find the next time this position got hit.
          const pointNearEndTime = await replayClient.getPointNearTime(arbitraryEndTime);
          const [hitPoints] = await getHitPointsForLocationAsync(
            replayClient,
            nextBreakablePosition,
            null,
            { begin: executionPoint, end: pointNearEndTime.point }
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

export default React.memo(function Event({
  currentTime,
  executionPoint,
  event,
  onSeek,
}: EventProps) {
  const dispatch = useAppDispatch();
  const { kind, point, time } = event;
  const isPaused = time === currentTime && executionPoint === point;
  const label = getEventLabel(event);
  const { icon } = getReplayEvent(kind);
  const [jumpToCodeStatus, setJumpToCodeStatus] = useState<JumpToCodeStatus>("not_checked");
  const [jumpToCodeState, dismissJumpToCodeNag] = useNag(Nag.JUMP_TO_CODE);
  const [jumpToEventState, dismissJumpToEventNag] = useNag(Nag.JUMP_TO_EVENT);

  const onKeyDown = (e: React.KeyboardEvent) => e.key === " " && e.preventDefault();

  const onClickSeek = () => {
    onSeek(point, time);
    dismissJumpToEventNag(); // Replay Assist
  };

  const onClickJumpToCode = async () => {
    // Seek to the sidebar event timestamp right away.
    // That way we're at least _close_ to the right time
    onSeek(point, time);

    if (event.kind === "mousedown" || event.kind === "keypress") {
      setJumpToCodeStatus("loading");
      const result = await dispatch(
        jumpToClickEventFunctionLocation(event as PointWithEventType, onSeek)
      );

      setJumpToCodeStatus(result);
      if (result === "not_loaded") {
        // Clear this out after a few seconds since the user could change focus.
        // Simpler than trying to watch the focus region change over time.
        setTimeout(() => {
          setJumpToCodeStatus("not_checked");
        }, 5000);
      }
    }

    // update Replay Assist
    dismissJumpToCodeNag();
  };

  const { contextMenu, onContextMenu } = useEventContextMenu(event);

  const onMouseEnter = () => {
    dispatch(
      setMarkTimeStampPoint({
        point: event.point,
        time: event.time,
      })
    );
  };

  const onMouseLeave = () => {
    dispatch(setMarkTimeStampPoint(null));
  };

  return (
    <>
      <div
        className={classnames(styles.eventRow, "group block w-full", {
          "text-lightGrey": currentTime < time,
          "font-semibold text-primaryAccent": isPaused,
        })}
        onClick={onClickSeek}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex flex-row items-center space-x-2 overflow-hidden">
          <MaterialIcon iconSize="xl">{icon}</MaterialIcon>
          <Label>{label}</Label>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100">
          {event.kind === "mousedown" || event.kind === "keypress" ? (
            <JumpToCodeButton
              onClick={onClickJumpToCode}
              status={jumpToCodeStatus}
              currentExecutionPoint={executionPoint}
              targetExecutionPoint={event.point}
            />
          ) : null}
        </div>
      </div>
      {contextMenu}
    </>
  );
});

const Label = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden overflow-ellipsis whitespace-pre font-normal">{children}</div>
);

export function findFirstBreakablePositionForFunction(
  functionSourceLocation: Location,
  breakablePositionsByLine: Map<number, SameLineSourceLocations>
) {
  const nearestLines: SameLineSourceLocations[] = [];
  for (let i = 0; i < 3; i++) {
    const lineToCheck = functionSourceLocation.line + i;
    const linePositions = breakablePositionsByLine.get(lineToCheck);
    if (linePositions) {
      nearestLines.push(linePositions);
    }
  }

  const positionsAsLocations: Location[] = nearestLines.flatMap(line => {
    return line.columns.map(column => {
      return {
        sourceId: functionSourceLocation.sourceId,
        line: line.line,
        column,
      };
    });
  });

  // We _hope_ that the first breakable position _after_ this function declaration is the first
  // position _inside_ the function itself, either a later column on the same line or on the next line.
  const nextBreakablePosition = positionsAsLocations.find(
    p =>
      (p.line === functionSourceLocation.line && p.column > functionSourceLocation.column) ||
      p.line > functionSourceLocation.line
  );
  return nextBreakablePosition;
}
