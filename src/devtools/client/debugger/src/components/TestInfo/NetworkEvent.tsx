import classNames from "classnames";
import React from "react";

import { setSelectedPanel, setViewMode } from "ui/actions/layout";
import { selectAndFetchRequest } from "ui/actions/network";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { TestStepRow } from "./TestStepRow";

export function NetworkEvent({ request }: { request: RequestSummary }) {
  const { method, status, url, id, start, end } = request;

  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const onClick = () => {
    dispatch(setViewMode("dev"));
    dispatch(setSelectedPanel("network"));
    dispatch(selectAndFetchRequest(id));
  };

  const pathname = new URL(url).pathname;
  const error = !!status && status >= 400;

  return (
    <TestStepRow
      pending={!!end && start > currentTime}
      active={start <= currentTime && !!end && end >= currentTime}
      error={error}
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
