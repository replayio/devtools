import { MutableRefObject, memo, useContext, useRef } from "react";

import { ProtocolViewerContext } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";
import { useScrollSelectedRequestIntoView } from "ui/components/ProtocolViewer/hooks/useScrollSelectedRequestIntoView";
import { ProtocolError, ProtocolRequest, ProtocolResponse } from "ui/reducers/protocolMessages";
import { formatDuration, formatTimestamp } from "ui/utils/time";

import styles from "./ProtocolViewerListItem.module.css";

export const REQUEST_DURATION_MEDIUM_THRESHOLD_MS = 500;
export const REQUEST_DURATION_SLOW_THRESHOLD_MS = 10_000;

export function ProtocolViewerListItem({ id }: { id: number }) {
  const {
    errorMap,
    longestRequestDuration,
    requestMap,
    responseMap,
    selectedRequestId,
    selectRequest,
  } = useContext(ProtocolViewerContext);

  const error = errorMap[id];
  const request = requestMap[id];
  const response = responseMap[id];

  const isSelected = id === selectedRequestId;

  return (
    <MemoizedProtocolViewerListItem
      error={error}
      isSelected={isSelected}
      longestRequestDuration={longestRequestDuration}
      request={request}
      response={response}
      selectRequest={selectRequest}
    />
  );
}

const MemoizedProtocolViewerListItem = memo(function MemoizedProtocolViewerListItem({
  error,
  isSelected,
  longestRequestDuration,
  request,
  response,
  selectRequest,
}: {
  error: ProtocolError;
  isSelected: boolean;
  longestRequestDuration: number;
  request: ProtocolRequest;
  response: ProtocolResponse;
  selectRequest: (id: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;

  const didError = error != null;

  useScrollSelectedRequestIntoView(ref, isSelected);

  let className = styles.Request;
  if (isSelected) {
    className = styles.RequestSelected;
  } else if (didError) {
    className = styles.RequestErrored;
  }

  const duration = response ? response.recordedAt - request.recordedAt : 0;
  let durationClassName = styles.RelativeDurationBlockFast;
  if (isSelected) {
    durationClassName = styles.RelativeDurationBlockSelected;
  } else if (duration > REQUEST_DURATION_SLOW_THRESHOLD_MS) {
    durationClassName = styles.RelativeDurationBlockSlow;
  } else if (duration > REQUEST_DURATION_MEDIUM_THRESHOLD_MS) {
    durationClassName = styles.RelativeDurationBlockMedium;
  }

  const relativeDurationPercentage = Math.cbrt(duration) / Math.cbrt(longestRequestDuration);

  return (
    <div ref={ref} className={className} onClick={() => selectRequest(request.id)}>
      <div className={styles.RequestStartTime}>{formatTimestamp(request.recordedAt)}</div>
      <div
        className={styles.RelativeDurationContainer}
        data-incomplete={response == null || undefined}
        title={formatDuration(duration)}
      >
        {duration > 0 && (
          <div
            className={durationClassName}
            style={{ width: `${relativeDurationPercentage * 100}%` }}
          />
        )}
      </div>
      <div className={styles.RequestMethod} title={`${request.class}.${request.method}`}>
        {request.method}
      </div>
    </div>
  );
});
