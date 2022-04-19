import { openSourceLink } from "devtools/client/debugger/src/actions/ui";
import { EventListenerPoint } from "devtools/client/debugger/src/reducers/event-listeners";
import React, { MouseEvent } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { trackEvent } from "ui/utils/telemetry";

import MaterialIcon from "../shared/MaterialIcon";

const getTimestamp = (ms: number) => {
  const date = new Date(ms);
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds();

  return `${minutes}:${seconds}:${milliseconds}`;
};

function Match({
  eventPoint,
  setViewMode,
  seek,
  openSourceLink,
}: PropsFromRedux & { eventPoint: EventListenerPoint }) {
  const { time, point, frame } = eventPoint;
  const { column, line, sourceId } = frame[0];

  const onClick = (e: MouseEvent) => {
    e.stopPropagation();

    trackEvent("events_timeline.select_source");
    setViewMode("dev");
    openSourceLink(sourceId, line, column);
    seek(point, time, true);
  };

  return (
    <button
      className="event-match flex text-gray-500 opacity-0 hover:text-gray-700"
      onClick={onClick}
      title={getTimestamp(time)}
    >
      <MaterialIcon outlined={true}>description</MaterialIcon>
    </button>
  );
}

const connector = connect(() => ({}), {
  openSourceLink,
  seek: actions.seek,
  setViewMode: actions.setViewMode,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Match);
