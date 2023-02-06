import classNames from "classnames";
import React from "react";

import { setSelectedPanel, setViewMode } from "ui/actions/layout";
import { selectAndFetchRequest } from "ui/actions/network";
import { setTimelineToTime } from "ui/actions/timeline";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { TestStepRow } from "./TestStepRow";

export function NetworkEvent({ request }: { request: RequestSummary }) {
  const { method, status, url, id, start, end } = request;

  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const active = start <= currentTime && !!end && end >= currentTime;

  const onClick = () => {
    dispatch(setViewMode("dev"));
    dispatch(setSelectedPanel("network"));
    dispatch(selectAndFetchRequest(id));
  };

  const handleMouseEnter = async () => {
    if (active || end == null) {
      return;
    }

    dispatch(setTimelineToTime(end));
  };

  const handleMouseLeave = () => {
    if (active) {
      return;
    }

    dispatch(setTimelineToTime(null));
  };

  const pathname = new URL(url).pathname;
  const error = !!status && status >= 400;

  return (
    <TestStepRow
      pending={!!end && start > currentTime}
      active={active}
      error={error}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex items-center truncate italic opacity-70"
        onClick={onClick}
        title={pathname}
      >
        <span
          className={classNames("mr-2 h-3 w-3 rounded-full", {
            "bg-testsuitesErrorBgcolor": error,
            "bg-testsuitesSuccessColor": !!status && status < 400,
          })}
        />
        {method} {status} {pathname}
      </button>
    </TestStepRow>
  );
}
