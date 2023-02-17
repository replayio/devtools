import {
  ExecutionPoint,
  KeyboardEvent as ReplayKeyboardEvent,
  MouseEvent as ReplayMouseEvent,
} from "@replayio/protocol";
import classNames from "classnames";
import React, { ReactNode, useState } from "react";

import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import { getThreadContext } from "devtools/client/debugger/src/reducers/pause";
import { getFunctionBody } from "protocol/evaluation-utils";
import type { ThreadFront as TF } from "protocol/thread";
import { RecordingTarget } from "protocol/thread/thread";
import Icon from "replay-next/components/Icon";
import { createGenericCache } from "replay-next/src/suspense/createGenericCache";
import { EventLog, eventsMapper } from "replay-next/src/suspense/EventsCache";
import { getPauseIdAsync } from "replay-next/src/suspense/PauseCache";
import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { compareExecutionPoints } from "replay-next/src/utils/time";
import { ReplayClientInterface } from "shared/client/types";
import type { UIThunkAction } from "ui/actions";
import { SEARCHABLE_EVENT_TYPES, getEventListenerLocationAsync } from "ui/actions/event-listeners";
import useEventContextMenu from "ui/components/Events/useEventContextMenu";
import { getLoadedRegions } from "ui/reducers/app";
import { useAppDispatch } from "ui/setup/hooks";
import { ReplayEvent } from "ui/state/app";

import MaterialIcon from "../shared/MaterialIcon";
import { getReplayEvent } from "./eventKinds";
import styles from "./Event.module.css";

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

const { getValueAsync: getNextInteractionEventAsync } = createGenericCache<
  [replayClient: ReplayClientInterface, ThreadFront: typeof TF],
  [point: ExecutionPoint, replayEventType: SEARCHABLE_EVENT_TYPES, endTime: number],
  EventLog | undefined
>(
  "nextInteractionEventCache",
  async (point, replayEventType, endTime, replayClient, ThreadFront) => {
    const pointNearEndTime = await replayClient.getPointNearTime(endTime);

    const recordingTarget = await ThreadFront.getRecordingTarget();

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
  point => point
);

type EventProps = {
  currentTime: any;
  event: ReplayEvent;
  executionPoint: any;
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
function jumpToClickEventFunctionLocation(
  event: ReplayMouseEvent | ReplayKeyboardEvent,
  onSeek: (point: ExecutionPoint, time: number) => void
): UIThunkAction {
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
        return;
      }

      // The sidebar event time/point is a fraction earlier than any
      // actual JS that executed in response. Find the next click event
      // within a small time window
      const nextClickEvent = await getNextInteractionEventAsync(
        executionPoint,
        event.kind as SEARCHABLE_EVENT_TYPES,
        arbitraryEndTime,
        replayClient,
        ThreadFront
      );

      if (!nextClickEvent) {
        return;
      }

      const pauseId = await getPauseIdAsync(
        replayClient,
        nextClickEvent.point,
        nextClickEvent.time
      );

      // If we did have a click event, timewarp to that click's point
      onSeek(nextClickEvent.point, nextClickEvent.time);

      const sourceLocation = await getEventListenerLocationAsync(
        pauseId,
        event.kind as SEARCHABLE_EVENT_TYPES,
        ThreadFront,
        replayClient,
        getState
      );

      if (sourceLocation) {
        const cx = getThreadContext(getState());
        // Open the source file and jump to the line of this function.
        // NOTE: this is the _definition_ line,  _not_ the first _executing_ line!
        dispatch(selectLocation(cx, sourceLocation));
      }
    } catch (err) {
      // Let's just swallow this silently for now
    }
  };
}

export default function Event({ currentTime, executionPoint, event, onSeek }: EventProps) {
  const dispatch = useAppDispatch();
  const { kind, point, time } = event;
  const isPaused = time === currentTime && executionPoint === point;
  const [isHovered, setIsHovered] = useState(false);
  const label = getEventLabel(event);
  const { icon } = getReplayEvent(kind);

  const onKeyDown = (e: React.KeyboardEvent) => e.key === " " && e.preventDefault();

  const onClickSeek = () => {
    onSeek(point, time);
  };

  const onClickJumpToCode = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Seek to the sidebar event timestamp right away.
    // That way we're at least _close_ to the right time
    onSeek(point, time);

    if (event.kind === "mousedown" || event.kind === "keypress") {
      dispatch(jumpToClickEventFunctionLocation(event, onSeek));
    }
  };

  const { contextMenu, onContextMenu } = useEventContextMenu(event);

  const timeLabel =
    executionPoint === null || isExecutionPointsGreaterThan(event.point, executionPoint)
      ? "fast-forward"
      : "rewind";

  return (
    <>
      <div
        className={classNames(styles.eventRow, "group block w-full", {
          "text-lightGrey": currentTime < time,
          "font-semibold text-primaryAccent": isPaused,
        })}
        onClick={onClickSeek}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
      >
        <div className="flex flex-row items-center space-x-2 overflow-hidden">
          <MaterialIcon iconSize="xl">{icon}</MaterialIcon>
          <Label>{label}</Label>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100">
          {event.kind === "mousedown" || event.kind === "keypress" ? (
            <div
              onClick={onClickJumpToCode}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`${
                isHovered ? "h-6 px-2 shadow-sm" : "h-6 w-6"
              } transition-width flex items-center justify-center rounded-full bg-primaryAccent duration-100 ease-out`}
            >
              <div className="flex items-center space-x-1">
                {isHovered && <span className="truncate text-white ">Jump to code</span>}
                <Icon type={timeLabel} className="w-3.5 text-white" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {contextMenu}
    </>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden overflow-ellipsis whitespace-pre font-normal">{children}</div>
);
