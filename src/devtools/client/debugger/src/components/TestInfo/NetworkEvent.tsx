import React from "react";

import { setSelectedPanel, setViewMode } from "ui/actions/layout";
import { selectAndFetchRequest } from "ui/actions/network";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { TestStepRow } from "./TestStepRow";

export function NetworkEvent({ request }: { request: RequestSummary }) {
  const { method, status, url, id, end } = request;

  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const onClick = () => {
    dispatch(setViewMode("dev"));
    dispatch(setSelectedPanel("network"));
    dispatch(selectAndFetchRequest(id));
  };

  return (
    <TestStepRow pending={!!end && end > currentTime} error={!!status && status >= 400}>
      <button className="flex items-center italic opacity-70" onClick={onClick}>
        {method} {status} {new URL(url).pathname}
      </button>
    </TestStepRow>
  );
}
