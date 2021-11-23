import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import sortedLastIndex from "lodash/sortedLastIndex";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

import Event from "./Event";
import { trackEvent } from "ui/utils/telemetry";
import classNames from "classnames";
const { getEventListenerPoints } = require("devtools/client/debugger/src/reducers/event-listeners");

function CurrentTimeLine({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={classNames("m-0", isActive ? "bg-secondaryAccent" : "bg-transparent")}
      style={{ height: "3px" }}
    />
  );
}

const FILTERED_EVENT_TYPES = ["keydown", "keyup"];

function Events({ currentTime, events, executionPoint, seek, points }: PropsFromRedux) {
  const onSeek = (point: string, time: number) => {
    trackEvent("events_timeline.select");
    seek(point, time, false);
  };

  events = events.filter(e => !FILTERED_EVENT_TYPES.includes(e.kind || ""));

  const currentEventIndex = sortedLastIndex(
    events.map(e => e.time),
    currentTime
  );

  return (
    <div className="py-1.5 text-xs bg-white">
      {events.map((e, i) => {
        return (
          <div key={e.point}>
            <CurrentTimeLine isActive={currentEventIndex === i} />
            <div className="px-1.5">
              <Event onSeek={onSeek} event={e} {...{ currentTime, executionPoint, points }} />
            </div>
          </div>
        );
      })}
      <CurrentTimeLine isActive={currentEventIndex === events.length} />
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    events: selectors.getFlatEvents(state),
    points: getEventListenerPoints(state),
    executionPoint: getExecutionPoint(state),
  }),
  { seek: actions.seek }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Events);
