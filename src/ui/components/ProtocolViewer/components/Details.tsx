import { useState } from "react";

import { CommandResponse } from "protocol/socket";
import { ProtocolRequestDetail } from "ui/components/ProtocolViewer/components/ProtocolRequestDetail";
import { RequestSummaryChunk } from "ui/components/ProtocolViewer/types";
import { PrimarySmButton } from "ui/components/shared/Button";
import { Recorded, RequestSummary } from "ui/reducers/protocolMessages";

import styles from "./Details.module.css";

const MAX_DETAILS_TO_RENDER = 10;

export function Details({
  errorMap,
  requestMap,
  responseMap,
  selectedChunk,
}: {
  errorMap: { [id: number]: CommandResponse & Recorded };
  requestMap: { [id: number]: RequestSummary };
  responseMap: { [id: number]: CommandResponse & Recorded };
  selectedChunk: RequestSummaryChunk | null;
}) {
  const [loadAll, setLoadAll] = useState(false);

  if (selectedChunk === null) {
    return null;
  }

  const ids = loadAll ? selectedChunk.ids : selectedChunk.ids.slice(0, MAX_DETAILS_TO_RENDER);
  const hiddenCount = loadAll ? 0 : Math.max(0, selectedChunk.ids.length - MAX_DETAILS_TO_RENDER);

  return (
    <div className={styles.Details}>
      {ids.map((id, index) => {
        const error = errorMap[id];
        const request = requestMap[id];
        const response = responseMap[id];

        return (
          <ProtocolRequestDetail
            key={request!.id}
            index={index}
            request={request!}
            response={response}
            error={error}
          />
        );
      })}
      {hiddenCount > 0 && (
        <div className={styles.LoadRemainingDetails}>
          <PrimarySmButton color="blue" onClick={() => setLoadAll(true)}>
            Load additional {hiddenCount} requests...
          </PrimarySmButton>
        </div>
      )}
    </div>
  );
}
