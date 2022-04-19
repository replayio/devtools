import {
  EventTypePoints,
  getEventListenerPoints,
} from "devtools/client/debugger/src/reducers/event-listeners";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { ReplayEvent } from "ui/state/app";

import { EventKindKey, getReplayEvent } from "./Event";
import Match from "./Match";

// In Tom's example, the farthest a mouse click event was from the replay captured click
// (which is a mousedown) was 24ms. Based on that, 100 should be a comfortable window to
// start with.
const TIME_WINDOW = 100;

function getPointsForEvent(key: EventKindKey, time: number, points: EventTypePoints) {
  const eventPoints = points[key] || [];
  return eventPoints.filter((p: any) => Math.abs(time - p.time) < TIME_WINDOW / 2);
}

function Matches({ eventTypePoints, simpleEvent }: PropsFromRedux & { simpleEvent: ReplayEvent }) {
  const { kind, time } = simpleEvent;
  const { key: eventKey } = getReplayEvent(kind);

  if (!eventKey || !eventTypePoints) {
    return null;
  }

  const relatedPoints = getPointsForEvent(eventKey, time, eventTypePoints);

  if (!relatedPoints.length) {
    return null;
  }

  return (
    <div className="flex w-full flex-col items-start space-y-1">
      <div className="w-full">
        {relatedPoints.slice(0, 1).map((point, i) => (
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
