import { useContext } from "react";
import { useStreamingValue } from "suspense";

import Icon from "replay-next/components/Icon";
import { isNetworkRequestCommentTypeData } from "replay-next/components/sources/utils/comments";
import { networkRequestsCache } from "replay-next/src/suspense/NetworkRequestsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { setSelectedPanel } from "ui/actions/layout";
import { selectNetworkRequest } from "ui/actions/network";
import { getFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
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
  const replayClient = useContext(ReplayClientContext);

  const stream = networkRequestsCache.stream(replayClient);
  const data = useStreamingValue(stream);
  const records = data.data;
  if (records == null) {
    return null;
  }

  const record = records[networkRequestId];
  if (record == null) {
    return null;
  }

  const requestOpenEvent = record.events.openEvent;
  if (requestOpenEvent == null) {
    return null;
  }

  return (
    <ModernNetworkRequestPreview
      id={networkRequestId}
      method={requestOpenEvent.requestMethod}
      name={requestOpenEvent.requestUrl}
      time={record.timeStampedPoint.time}
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
    dispatch(selectNetworkRequest(id));
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
