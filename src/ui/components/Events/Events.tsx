import { KeyboardEvent, NavigationEvent } from "@recordreplay/protocol";
import classNames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { ReplayEvent } from "ui/state/app";
import { getFormattedTime } from "ui/utils/timeline";
import MaterialIcon from "../shared/MaterialIcon";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

function Event({
  onSeek,
  currentTime,
  executionPoint,
  event,
}: {
  event: ReplayEvent;
  currentTime: any;
  executionPoint: any;
  onSeek: (point: string, time: number) => void;
}) {
  const isPaused = event.time === currentTime && executionPoint === event.point;

  let text: string;
  let icon: string;

  if (event.kind?.includes("mouse")) {
    text = "Mouse Click";
    icon = "ads_click";
  } else if (event.kind?.includes("navigation")) {
    const ev = event as NavigationEvent;
    text = `Navigation (${ev.url})`;
    icon = "place";
  } else {
    icon = "keyboard";
    let ev = event as KeyboardEvent;
    let eventText;

    if (ev.kind === "keydown") {
      eventText = `Key Down`;
    } else if (ev.kind === "keyup") {
      eventText = `Key Up`;
    } else {
      eventText = `Key Press`;
    }

    text = `${eventText} (${ev.key})`;
  }

  return (
    <button
      onClick={() => onSeek(event.point, event.time)}
      className={classNames(
        "flex flex-row items-center justify-between p-4 rounded-lg hover:bg-gray-100 focus:outline-none",
        isPaused ? "text-primaryAccent" : ""
      )}
    >
      <div className="flex flex-row space-x-2 items-center overflow-hidden">
        <MaterialIcon highlighted={isPaused}>{icon}</MaterialIcon>
        <div
          className={classNames(
            isPaused ? "font-semibold" : "",
            "overflow-ellipsis overflow-hidden whitespace-pre"
          )}
        >
          {text}
        </div>
      </div>
      <div className={classNames("", isPaused ? "text-primaryAccent" : "")}>
        {getFormattedTime(event.time)}
      </div>
    </button>
  );
}

function Events({ events, seek, currentTime, executionPoint }: PropsFromRedux) {
  const onSeek = (point: string, time: number) => {
    seek(point, time, false);
  };

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item">Events</div>
      </div>
      <div className="flex-grow overflow-auto overflow-x-hidden flex flex-column items-center bg-white h-full">
        <div className="flex flex-col p-2 self-stretch space-y-2 w-full">
          {events.map((e, i) => (
            <Event key={i} onSeek={onSeek} event={e} {...{ currentTime, executionPoint }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    events: selectors.getFlatEvents(state),
    currentTime: selectors.getCurrentTime(state),
    executionPoint: getExecutionPoint(state),
  }),
  {
    seek: actions.seek,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Events);
