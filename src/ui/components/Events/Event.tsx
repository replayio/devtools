import React from "react";
import { KeyboardEvent, NavigationEvent } from "@recordreplay/protocol";
import classNames from "classnames";
import { ReplayEvent } from "ui/state/app";
import { getFormattedTime } from "ui/utils/timeline";
import MaterialIcon from "../shared/MaterialIcon";

const TIME_WINDOW = 1000;

function getPointsForEvent(eventName: any, event: ReplayEvent, points: any) {
  const eventPoints = points[eventName];
  const { time } = event;

  return eventPoints.filter((p: any) => Math.abs(time - p.time) < TIME_WINDOW / 2);
}

function Event({
  onSeek,
  currentTime,
  executionPoint,
  event,
  points,
}: {
  event: ReplayEvent;
  currentTime: any;
  executionPoint: any;
  onSeek: (point: string, time: number) => void;
  points?: any;
}) {
  const isPaused = event.time === currentTime && executionPoint === event.point;

  let text: string;
  let title: string;
  let icon: string;
  let pointArray: any[] = [];

  if (event.kind?.includes("mouse")) {
    text = "Mouse Click";
    title = "Mouse Click Event";
    icon = "ads_click";
    pointArray = getPointsForEvent("event.mouse.click", event, points);
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

  console.log({ points });

  return (
    <button
      onClick={() => onSeek(event.point, event.time)}
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
      <div className="flex flex-row justify-between w-full items-center space-x-2">
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
      </div>
      {pointArray.length ? <Matches points={pointArray} /> : null}
    </button>
  );
}

function Matches({ points }: { points: any[] }) {
  return (
    <div className="flex flex-col space-y-1 items-start">
      <div>Matches found:</div>
      <div>
        {points.map((p, i) => (
          <div key={i}>{`"mouseClick": 0:${Math.round(p.time)}`}</div>
        ))}
      </div>
    </div>
  );
}

export default Event;
