import React from "react";

import Icon from "bvaughn-architecture-demo/components/Icon";
import { setSelectedPanel } from "ui/actions/layout";
import { selectAndFetchRequest } from "ui/actions/network";
import { getSummaryById } from "ui/reducers/network";
import { getFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";
import { isInFocusSpan } from "ui/utils/timeline";

import styles from "./styles.module.css";

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
      className={isSeekEnabled ? styles.LabelGroup : styles.LabelGroupDisabled}
      onClick={isSeekEnabled ? onClick : undefined}
      title={isSeekEnabled ? "Show in the Network Monitor" : undefined}
    >
      <div className={styles.Labels}>
        <div className={styles.NetworkRequestLabel}>
          <span className={styles.NetworkRequestMethod}>{`[${method}]`}</span> {name}
        </div>
      </div>
      <Icon className={styles.Icon} type="chevron-right" />
    </div>
  );
}
