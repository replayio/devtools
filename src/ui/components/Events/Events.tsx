import { MouseEvent } from "@recordreplay/protocol";
import classNames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { getFormattedTime } from "ui/utils/timeline";
import MaterialIcon from "../shared/MaterialIcon";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

function Event({
  onSeek,
  currentTime,
  executionPoint,
  event,
}: {
  event: MouseEvent;
  currentTime: any;
  executionPoint: any;
  onSeek: (point: string, time: number) => void;
}) {
  const isPaused = event.time === currentTime && executionPoint === event.point;

  return (
    <button
      onClick={() => onSeek(event.point, event.time)}
      className={classNames(
        "flex flex-row justify-between text-xl p-4 rounded-lg hover:bg-gray-100 focus:outline-none",
        isPaused ? "text-primaryAccent" : "text-gray-800"
      )}
    >
      <div className="flex flex-row space-x-2 items-center">
        <MaterialIcon highlighted>ads_click</MaterialIcon>
        <div className={classNames(isPaused ? "font-semibold" : "")}>Mouse Click</div>
      </div>
      <div className="font-mono text-lg text-gray-500">{getFormattedTime(event.time)}</div>
    </button>
  );
}

function Events({ mousedownEvents, seek, currentTime, executionPoint }: PropsFromRedux) {
  const onSeek = (point: string, time: number) => {
    seek(point, time, false);
  };

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item">Events</div>
      </div>
      <div className="flex-grow overflow-auto overflow-x-hidden flex flex-column items-center bg-white h-full">
        <div className="flex flex-col p-2 self-stretch space-y-2 text-lg w-full text-gray-500">
          {mousedownEvents.map((e, i) => (
            <Event key={i} onSeek={onSeek} event={e} {...{ currentTime, executionPoint }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    mousedownEvents: selectors.getEventsForType(state, "mousedown"),
    currentTime: selectors.getCurrentTime(state),
    executionPoint: getExecutionPoint(state),
  }),
  {
    seek: actions.seek,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Events);
