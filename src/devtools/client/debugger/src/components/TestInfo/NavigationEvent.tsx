import React from "react";

import { CypressAnnotationMessage } from "shared/graphql/types";
import { seekToTime, setTimelineToTime } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { TestStepRow } from "./TestStepRow";

export function NavigationEvent({
  time,
  message,
}: {
  time: number;
  message: CypressAnnotationMessage;
}) {
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();
  const active = time === currentTime;

  const onClick = () => {
    dispatch(seekToTime(time));
  };

  const handleMouseEnter = async () => {
    if (active) {
      return;
    }

    dispatch(setTimelineToTime(time));
  };

  const handleMouseLeave = () => {
    if (active) {
      return;
    }

    dispatch(setTimelineToTime(null));
  };

  return (
    <TestStepRow
      active={active}
      pending={time > currentTime}
      key={(message.url || "url") + time}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer"
    >
      <MaterialIcon className="mr-1 opacity-70" iconSize="sm">
        navigation
      </MaterialIcon>
      <div className="truncate italic opacity-70" title={message.url}>
        {message.url}
      </div>
    </TestStepRow>
  );
}
