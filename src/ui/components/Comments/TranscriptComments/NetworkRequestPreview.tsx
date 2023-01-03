import Icon from "replay-next/components/Icon";
import { isNetworkRequestCommentTypeData } from "replay-next/components/sources/utils/comments";
import { setSelectedPanel } from "ui/actions/layout";
import { selectAndFetchRequest } from "ui/actions/network";
import { getSummaryById } from "ui/reducers/network";
import { getFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { Comment } from "ui/state/comments";
import { trackEvent } from "ui/utils/telemetry";
import { isInFocusSpan } from "ui/utils/timeline";

import styles from "./styles.module.css";

// Adapter component that can handle rendering legacy or modern network-request comments.
export default function NetworkRequestPreview({ comment }: { comment: Comment }) {
  const { type, typeData } = comment;

  if (isNetworkRequestCommentTypeData(type, typeData)) {
    // Modern comments store all of the information needed to render the comment preview in the typeData field.
    return (
      <ModernNetworkRequestPreview
        id={typeData.id}
        method={typeData.method}
        name={typeData.name}
        time={comment.time}
      />
    );
  } else if (comment.networkRequestId !== null) {
    // Legacy comments store only the network request id (which must be used to match against Redux data).
    return <LegacyNetworkRequestPreview networkRequestId={comment.networkRequestId} />;
  } else {
    return null;
  }
}

function LegacyNetworkRequestPreview({ networkRequestId }: { networkRequestId: string }) {
  const request = useAppSelector((state: UIState) => getSummaryById(state, networkRequestId));
  if (request == null) {
    return null;
  }

  return (
    <ModernNetworkRequestPreview
      id={networkRequestId}
      method={request.method}
      name={request.name}
      time={request.point.time}
    />
  );
}

function ModernNetworkRequestPreview({
  id,
  method,
  name,
  time,
}: {
  id: string;
  method: string;
  name: string;
  time: number;
}) {
  const dispatch = useAppDispatch();
  const focusRegion = useAppSelector(getFocusRegion);

  const onClick = () => {
    trackEvent("comments.select_request");
    dispatch(setSelectedPanel("network"));
    dispatch(selectAndFetchRequest(id));
  };

  const isSeekEnabled = focusRegion == null || isInFocusSpan(time, focusRegion);

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
