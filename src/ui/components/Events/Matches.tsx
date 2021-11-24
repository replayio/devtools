import {
  EventTypePoints,
  getEventListenerPoints,
} from "devtools/client/debugger/src/reducers/event-listeners";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { ReplayEvent } from "ui/state/app";
import Match from "./Match";

const SUPPORTED_REPLAY_EVENTS: { [kind: string]: string } = { mousedown: "event.mouse.click" };

// In Tom's example, the farthest a mouse click event was from the replay captured click
// (which is a mousedown) was 24ms. Based on that, 100 should be a comfortable window to
// start with.
const TIME_WINDOW = 100;

function getPointsForEvent(eventName: any, event: ReplayEvent, points: EventTypePoints) {
  const eventPoints = points[eventName];
  const { time } = event;

  return eventPoints.filter((p: any) => Math.abs(time - p.time) < TIME_WINDOW / 2);
}

function Matches({
  eventTypePoints,
  onSeek,
  event,
}: PropsFromRedux & { onSeek: any; event: ReplayEvent }) {
  const { kind } = event;

  // This only supports mousedown ("Click") for now.
  if (!kind || !SUPPORTED_REPLAY_EVENTS[kind]) {
    return null;
  }

  const eventName = SUPPORTED_REPLAY_EVENTS[kind];
  const relatedPoints = getPointsForEvent(eventName, event, eventTypePoints);

  if (!relatedPoints.length) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-1 items-start w-full">
      <div className="w-full">
        {relatedPoints.map((point, i) => (
          <Match eventPoint={point} key={i} />
        ))}
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({ eventTypePoints: getEventListenerPoints(state) }),
  { setViewMode: actions.setViewMode }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Matches);
