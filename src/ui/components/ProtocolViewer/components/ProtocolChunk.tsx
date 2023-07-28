import React, { MutableRefObject, memo, useLayoutEffect, useRef } from "react";

import { CommandResponse } from "protocol/socket";
import { RequestSummaryChunk } from "ui/components/ProtocolViewer/types";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recorded, RequestSummary } from "ui/reducers/protocolMessages";
import { formatDuration, formatTimestamp } from "ui/utils/time";

import styles from "./ProtocolViewer.module.css";

const REQUEST_DURATION_MEDIUM_THRESHOLD_MS = 250;
const REQUEST_DURATION_SLOW_THRESHOLD_MS = 1000;

export const ProtocolChunk = memo(function ProtocolChunk({
  chunk,
  responseMap,
  requestMap,
  selectedChunk,
  setSelectedChunk,
}: {
  chunk: RequestSummaryChunk;
  responseMap: { [key: number]: CommandResponse & Recorded };
  requestMap: { [key: number]: RequestSummary };
  selectedChunk: RequestSummaryChunk | null;
  setSelectedChunk: React.Dispatch<React.SetStateAction<RequestSummaryChunk | null>>;
}) {
  const isSelected = selectedChunk === chunk;
  const prevIsSelectedRef = useRef<boolean>(false);

  const ref = useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;

  // Make sure the selected request is still visible after details panel opens.
  useLayoutEffect(() => {
    if (isSelected && prevIsSelectedRef.current !== isSelected) {
      const div = ref.current;
      if (div) {
        div.scrollIntoView({ block: "nearest", behavior: "auto" });
      }
    }

    prevIsSelectedRef.current = isSelected;
  }, [isSelected]);

  let className = styles.Chunk;
  if (isSelected) {
    className = styles.ChunkSelected;
  } else if (chunk.errored) {
    className = styles.ChunkErrored;
  } else if (chunk.pending) {
    className = styles.ChunkPending;
  }

  const chunksLength = chunk.ids.length;

  const durations = chunk.ids.reduce((total, id) => {
    const request = requestMap[id];
    const response = responseMap[id];
    if (request && response) {
      total += response.recordedAt - request.recordedAt;
    }
    return total;
  }, 0);
  const averageDuration = Math.round(durations / chunksLength);

  const selectChunk = () => setSelectedChunk(chunk);

  let durationName = styles.ChunkDurationFast;
  if (averageDuration > REQUEST_DURATION_SLOW_THRESHOLD_MS) {
    durationName = styles.ChunkDurationSlow;
  } else if (averageDuration > REQUEST_DURATION_MEDIUM_THRESHOLD_MS) {
    durationName = styles.ChunkDurationMedium;
  }

  const durationTitle =
    chunksLength > 1 ? `${averageDuration}ms average` : `${Math.round(durations)}ms`;

  return (
    <div ref={ref} className={className} onClick={selectChunk}>
      <div className={styles.ChunkStartTime}>{formatTimestamp(chunk.startedAt)}</div>
      <div className={styles.ChunkCount}>
        {chunk.count > 1 ? <div className={styles.ChunkCountBadge}>{chunk.count}</div> : null}
      </div>
      <div className={styles.ChunkMethod} title={`${chunk.class}.${chunk.method}`}>
        {chunk.method}
      </div>
      <div className={styles.ChunkDuration}>
        {durations > 0 ? (
          <div className={durationName} title={durationTitle}>
            {formatDuration(averageDuration)}
          </div>
        ) : (
          <MaterialIcon>pending</MaterialIcon>
        )}
      </div>
    </div>
  );
});
