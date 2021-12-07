import React, { KeyboardEvent, MouseEvent, ReactNode } from "react";
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
  showLink: boolean;
};

const EVENT_KINDS: { [key: string]: EventKind } = {
  keydown: { icon: "keyboard", label: "Key Down", key: "event.keyboard.keydown" },
  keyup: { icon: "keyboard", label: "Key Up", key: "event.keyboard.keyup" },
  keypress: { icon: "keyboard", label: "Key Press", key: "event.keyboard.keypress" },
  mousedown: { icon: "ads_click", label: "Click", key: "event.mouse.click" },
  navigation: { icon: "navigation", label: "Navigation" },
};

type Kind = keyof typeof EVENT_KINDS;
type EventKind = { icon: EventKindIcon; label: EventKindLabel; key?: EventKindKey };
type EventKindIcon = "keyboard" | "ads_click" | "navigation";
type EventKindLabel = "Key Down" | "Key Up" | "Key Press" | "Click" | "Navigation";
export type EventKindKey =
  | "event.keyboard.keydown"
  | "event.keyboard.keyup"
  | "event.keyboard.keypress"
  | "event.mouse.click";

export const getReplayEvent = (kind: Kind) => EVENT_KINDS[kind];
const getEventLabel = (event: ReplayEvent) => {
  const { kind } = event;
  const { label } = getReplayEvent(kind);

  if ("key" in event) {
    return `${label} ${event.key}`;
  }

  return label;
};

export default function Event({
  onSeek,
  currentTime,
  executionPoint,
  event,
  showLink,
}: EventProps) {
  const { kind, point, time } = event;
  const isPaused = time === currentTime && executionPoint === point;

  const label = getEventLabel(event);
  const { icon } = getReplayEvent(kind);

  const onKeyDown = (e: KeyboardEvent) => e.key === " " && e.preventDefault();
  const onClick = (e: MouseEvent) => onSeek(point, time);

  return (
    <div
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={classNames(
        "event flex flex-row justify-between items-center space-x-2 user-select-none",
        "group block p-3 w-full rounded-lg hover:bg-gray-100 focus:outline-none",
        {
          "text-lightGrey": currentTime < time,
          "text-primaryAccent font-semibold": isPaused,
        }
      )}
    >
      <div className="flex flex-row space-x-2 items-center overflow-hidden">
        <MaterialIcon className="group-hover:text-primaryAccent" iconSize="xl">
          {icon}
        </MaterialIcon>
        <Label>{label}</Label>
      </div>
      <div className="flex space-x-2">
        {showLink ? <Matches simpleEvent={event} /> : null}
        <div>{getFormattedTime(time)}</div>
      </div>
    </div>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="overflow-ellipsis overflow-hidden whitespace-pre font-normal">{children}</div>
);
