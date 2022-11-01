import classNames from "classnames";
import React from "react";

import { setSelectedPanel } from "ui/actions/layout";
import { selectAndFetchRequest } from "ui/actions/network";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getSummaryById } from "ui/reducers/network";
import { getFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";
import { isInFocusSpan } from "ui/utils/timeline";

export default function NetworkRequestPreview({ networkRequestId }: { networkRequestId: string }) {
  const dispatch = useAppDispatch();
  const request = useAppSelector((state: UIState) => getSummaryById(state, networkRequestId));
  const focusRegion = useAppSelector(getFocusRegion);

  if (!request) {
    return null;
  }

  const onClick = () => {
    trackEvent("comments.select_request");
    dispatch(setSelectedPanel("network"));
    dispatch(selectAndFetchRequest(networkRequestId));
  };

  const isSeekEnabled = focusRegion == null || isInFocusSpan(request.point.time, focusRegion);

  const { method, name } = request;

  return (
    <div
      onClick={isSeekEnabled ? onClick : undefined}
      className={classNames(
        "group rounded-md border-gray-200 bg-chrome px-2 py-0.5",
        isSeekEnabled && "cursor-pointer hover:bg-themeTextFieldBgcolor"
      )}
    >
      <div className="mono flex flex-col font-medium">
        <div className="flex w-full flex-row justify-between space-x-1">
          <div
            className="cm-s-mozilla space-x-2 overflow-hidden whitespace-pre font-mono text-xs"
            style={{ fontSize: "11px" }}
          >
            <span className="font-bold">{`[${method}]`}</span>
            <span>{name}</span>
          </div>
          <div
            className={classNames(
              "flex flex-shrink-0 opacity-0 transition",
              isSeekEnabled && "group-hover:opacity-100"
            )}
            title="Show in the Network Monitor"
          >
            <MaterialIcon iconSize="sm">keyboard_arrow_right</MaterialIcon>
          </div>
        </div>
      </div>
    </div>
  );
}
