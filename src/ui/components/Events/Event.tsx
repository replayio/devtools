import React from "react";
import { KeyboardEvent, NavigationEvent } from "@recordreplay/protocol";
import classNames from "classnames";
import { ReplayEvent } from "ui/state/app";
import { getFormattedTime } from "ui/utils/timeline";
import MaterialIcon from "../shared/MaterialIcon";
import Matches from "./Matches";

type EventProps = {
  event: ReplayEvent;
  currentTime: any;
  executionPoint: any;
  onSeek: (point: string, time: number) => void;
};

export default function Event({ onSeek, currentTime, executionPoint, event }: EventProps) {
  const isPaused = event.time === currentTime && executionPoint === event.point;

  let text: string;
  let title: string;
  let icon: string;

  if (event.kind?.includes("mouse")) {
    text = "Mouse Click";
    title = "Mouse Click Event";
    icon = "ads_click";
    // pointArray = getPointsForEvent("event.mouse.click", event, eventTypePoints);
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
    <div
      onKeyDown={event => {
        if (event.key === " ") {
          event.preventDefault();
        }
      }}
      title={title}
      className={classNames(
        "group",
        "flex flex-col w-full p-3 rounded-lg hover:bg-gray-100 focus:outline-none space-y-2",
        {
          "text-lightGrey": currentTime < event.time,
          "text-primaryAccent": isPaused,
        }
      )}
    >
      <button
        onClick={() => onSeek(event.point, event.time)}
        className="flex flex-row justify-between w-full items-center space-x-2"
      >
        <div className="flex flex-row space-x-2 items-center overflow-hidden">
          <MaterialIcon className="group-hover:text-primaryAccent" iconSize="xl">
            {icon}
          </MaterialIcon>
          <div
            className={classNames("overflow-ellipsis overflow-hidden whitespace-pre", {
              "font-semibold": isPaused,
            })}
          >
            {text}
          </div>
        </div>
        <div className={classNames({ "text-primaryAccent": isPaused })}>
          {getFormattedTime(event.time)}
        </div>
      </button>
      <Matches onSeek={onSeek} event={event} />
    </div>
  );
}
