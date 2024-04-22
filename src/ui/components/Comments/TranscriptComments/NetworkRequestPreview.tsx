import { useContext } from "react";

import Icon from "replay-next/components/Icon";
import { NetworkRequestComment } from "replay-next/components/sources/utils/comments";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { setSelectedPanel, setViewMode } from "ui/actions/layout";
import { selectNetworkRequest } from "ui/actions/network";
import { useAppDispatch } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";
import { isInFocusSpan } from "ui/utils/timeline";

import styles from "./styles.module.css";

// Adapter component that can handle rendering legacy or modern network-request comments.
export default function NetworkRequestPreview({ comment }: { comment: NetworkRequestComment }) {
  const { id, method, name, time } = comment.typeData;

  const dispatch = useAppDispatch();

  const { range: focusWindow } = useContext(FocusContext);

  const onClick = () => {
    trackEvent("comments.select_request");

    dispatch(setViewMode("dev"));
    dispatch(setSelectedPanel("network"));
    dispatch(selectNetworkRequest(id));
  };

  const isSeekEnabled = focusWindow == null || isInFocusSpan(time, focusWindow);

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
