import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import sortedLastIndex from "lodash/sortedLastIndex";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

import Event from "./Event";
import { trackEvent } from "ui/utils/telemetry";

function CurrentTimeLine() {
  return <div className="bg-secondaryAccent w-full m-0" style={{ height: "3px" }} />;
}

const FILTERED_EVENT_TYPES = ["keydown", "keyup"];

function Events({ currentTime, events, executionPoint, seek }: PropsFromRedux) {
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
    <div className="flex flex-col py-1.5 self-stretch space-y-1.5 w-full text-xs">
      {events.map((e, i) => {
        return (
          <div key={e.point}>
            {i === currentEventIndex ? <CurrentTimeLine /> : null}
            <div className="px-1.5">
              <Event onSeek={onSeek} event={e} {...{ currentTime, executionPoint }} />
            </div>
          </div>
        );
      })}
      {currentEventIndex === events.length ? <CurrentTimeLine /> : null}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    events: selectors.getFlatEvents(state),
    executionPoint: getExecutionPoint(state),
  }),
  { seek: actions.seek }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Events);
