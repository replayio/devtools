import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedPanel } from "ui/actions/layout";
import { showRequestDetails } from "ui/actions/network";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getSummaryById } from "ui/reducers/network";
import { UIState } from "ui/state";

import { trackEvent } from "ui/utils/telemetry";

export default function NetworkRequestPreview({ networkRequestId }: { networkRequestId: string }) {
  const dispatch = useDispatch();
  const request = useSelector((state: UIState) => getSummaryById(state, networkRequestId));

  const onClick = () => {
    trackEvent("comments.select_request");
    dispatch(setSelectedPanel("network"));
    dispatch(showRequestDetails(networkRequestId));
  };

  if (!request) {
    return null;
  }

  const { method, name, domain } = request;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-md border-gray-200 bg-chrome px-2 py-0.5 hover:bg-themeTextFieldBgcolor"
    >
      <div className="mono flex flex-col font-medium">
        <div className="flex w-full flex-row justify-between space-x-1">
          <div
            className="cm-s-mozilla overflow-hidden whitespace-pre font-mono text-xs space-x-2"
            style={{ fontSize: "11px" }}
          >
            <span>{`[${method}]`}</span>
            <span>{name}</span>
            <span>({`${domain}`})</span>
          </div>
          <div
            className="flex flex-shrink-0 opacity-0 transition group-hover:opacity-100"
            title="Show in the Network Monitor"
          >
            <MaterialIcon iconSize="sm">keyboard_arrow_right</MaterialIcon>
          </div>
        </div>
      </div>
    </div>
  );
}
