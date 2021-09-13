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
import Spinner from "../shared/Spinner";
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
  let title: string;
  let icon: string;

  if (event.kind?.includes("mouse")) {
    text = "Mouse Click";
    title = "Mouse Click Event";
    icon = "ads_click";
  } else if (event.kind?.includes("navigation")) {
    const ev = event as NavigationEvent;
    text = `${ev.url}`;
    title = "Navigation Event";
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

    text = `${eventText} ${ev.key}`;
    title = `${eventText} event`;
  }

  return (
    <button
      onClick={() => onSeek(event.point, event.time)}
      title={title}
      className={classNames(
        "group",
        "flex flex-row items-center justify-between p-3 rounded-lg hover:bg-gray-100 focus:outline-none space-x-2",
        isPaused ? "text-primaryAccent" : ""
      )}
    >
      <div className="flex flex-row space-x-2 items-center overflow-hidden">
        <MaterialIcon className="group-hover:text-primaryAccent">{icon}</MaterialIcon>
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

function EventsLoaderItem({ category, isLoading }: { category: string; isLoading: boolean }) {
  return (
    <div className="flex flex-row space-x-2 items-center overflow-hidden">
      {isLoading ? (
        <div
          className="flex flex-col items-center justify-center"
          style={{ minHeight: "22px", minWidth: "22px" }}
        >
          <Spinner className="animate-spin h-5 w-5" />
        </div>
      ) : (
        <MaterialIcon>done</MaterialIcon>
      )}
      <span>{category} events</span>
    </div>
  );
}

function EventsLoader({
  eventCategoriesLoading,
}: {
  eventCategoriesLoading: { [key: string]: boolean };
}) {
  return (
    <div className="space-y-3 flex flex-col w-full p-3 bg-gray-100 rounded-md">
      <strong>Loading events:</strong>
      <div className="flex flex-col w-full space-y-1">
        {Object.keys(eventCategoriesLoading).map(category => {
          return (
            <EventsLoaderItem
              category={category}
              isLoading={eventCategoriesLoading[category]}
              key={category}
            />
          );
        })}
      </div>
    </div>
  );
}

function Events({
  events,
  eventCategoriesLoading,
  seek,
  currentTime,
  executionPoint,
  progressPercentage,
}: PropsFromRedux) {
  const onSeek = (point: string, time: number) => {
    seek(point, time, false);
  };

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item">Events</div>
      </div>
      <div className="flex-grow overflow-auto overflow-x-hidden flex flex-column items-center bg-white h-full">
        <div className="flex flex-col p-1.5 self-stretch space-y-1.5 w-full text-xs">
          {progressPercentage < 100 ? <EventsLoader {...{ eventCategoriesLoading }} /> : null}
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
    progressPercentage: selectors.getIndexing(state),
    eventCategoriesLoading: selectors.getEventCategoriesLoading(state),
  }),
  {
    seek: actions.seek,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Events);
