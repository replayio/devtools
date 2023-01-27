import classNames from "classnames";
import React, { KeyboardEvent, MouseEvent, ReactNode } from "react";

import useEventContextMenu from "ui/components/Events/useEventContextMenu";
import { ReplayEvent } from "ui/state/app";
import { getFormattedTime } from "ui/utils/timeline";

import MaterialIcon from "../shared/MaterialIcon";
import { getReplayEvent } from "./eventKinds";

type EventProps = {
  currentTime: any;
  event: ReplayEvent;
  executionPoint: any;
  onSeek: (point: string, time: number) => void;
};

export const getEventLabel = (event: ReplayEvent) => {
  const { kind } = event;
  const { label } = getReplayEvent(kind);

  if (kind === "navigation") {
    const url = new URL(event.url);
    return <span title={event.url}>{url.host}</span>;
  }

  if ("key" in event) {
    return `${label} ${event.key}`;
  }

  return label;
};

export default function Event({ currentTime, executionPoint, event, onSeek }: EventProps) {
  const { kind, point, time } = event;
  const isPaused = time === currentTime && executionPoint === point;

  const label = getEventLabel(event);
  const { icon } = getReplayEvent(kind);

  const onKeyDown = (e: KeyboardEvent) => e.key === " " && e.preventDefault();
  const onClick = (e: MouseEvent) => onSeek(point, time);

  const { contextMenu, onContextMenu } = useEventContextMenu(event);

  return (
    <>
      <div
        className={classNames(
          "event user-select-none mb-1 mt-1 flex flex-row items-center justify-between",
          "group block w-full cursor-pointer rounded-lg py-1 pl-4 pr-2 hover:bg-themeMenuHighlight focus:outline-none",
          {
            "text-lightGrey": currentTime < time,
            "font-semibold text-primaryAccent": isPaused,
          }
        )}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
      >
        <div className="flex flex-row items-center space-x-2 overflow-hidden">
          <MaterialIcon className="group-hover:text-primaryAccent" iconSize="xl">
            {icon}
          </MaterialIcon>
          <Label>{label}</Label>
        </div>
        <div className="flex space-x-2">
          <div>{getFormattedTime(time)}</div>
        </div>
      </div>
      {contextMenu}
    </>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden overflow-ellipsis whitespace-pre font-normal">{children}</div>
);
