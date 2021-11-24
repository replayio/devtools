import { openSourceLink } from "devtools/client/debugger/src/actions/ui";
import { EventListenerPoint } from "devtools/client/debugger/src/reducers/event-listeners";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { trackEvent } from "ui/utils/telemetry";

const getTimestamp = (ms: number) => {
  const date = new Date(ms);
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds();

  return `0:${seconds}:${milliseconds}`;
};

function Match({
  eventPoint,
  setViewMode,
  seek,
  openSourceLink,
}: PropsFromRedux & { eventPoint: EventListenerPoint }) {
  const { time, point, frame } = eventPoint;
  const { column, line, sourceId } = frame[0];

  const selectSource = () => {
    trackEvent("events_timeline.select_source");

    setViewMode("dev");
    openSourceLink(sourceId, line, column);
    seek(point, time, true);
  };

  return (
    <button
      className="flex justify-between w-full p-1 pl-4 hover:bg-gray-200"
      onClick={selectSource}
    >
      <div>Go to source</div>
      <div>{getTimestamp(time)}</div>
    </button>
  );
}

const connector = connect(() => ({}), {
  setViewMode: actions.setViewMode,
  openSourceLink,
  seek: actions.seek,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Match);
