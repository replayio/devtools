import React, { useDeferredValue, useMemo, useState } from "react";

import { ThreadFront } from "protocol/thread";
import { Details } from "ui/components/ProtocolViewer/components/Details";
import { ProtocolChunk } from "ui/components/ProtocolViewer/components/ProtocolChunk";
import { RequestSummaryChunk } from "ui/components/ProtocolViewer/types";
import { flattenRequests } from "ui/components/ProtocolViewer/utils/flattenRequests";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useGetUserInfo } from "ui/hooks/users";
import {
  ProtocolErrorMap,
  ProtocolRequestMap,
  ProtocolResponseMap,
} from "ui/reducers/protocolMessages";

import styles from "./ProtocolViewer.module.css";

const ADMIN_APP_BASE_URL = "http://admin.replay.prod/controllers";

export function ProtocolViewer({
  errorMap,
  requestMap,
  responseMap,
}: {
  errorMap: ProtocolErrorMap;
  requestMap: ProtocolRequestMap;
  responseMap: ProtocolResponseMap;
}) {
  const [clearBeforeIndex, setClearBeforeIndex] = useState(0);
  const [filterText, setFilterText] = useState("");
  const deferredFilterText = useDeferredValue(filterText);

  const [selectedChunk, setSelectedChunk] = useState<RequestSummaryChunk | null>(null);

  const chunks = useMemo(() => flattenRequests(requestMap), [requestMap]);
  const filteredChunks = useMemo(
    () =>
      chunks.slice(clearBeforeIndex).filter(chunk => {
        const fullString = `${chunk.class}.${chunk.method}`.toLowerCase();
        return fullString.includes(deferredFilterText.toLowerCase());
      }),
    [chunks, clearBeforeIndex, deferredFilterText]
  );
  const doesFilteredChunksContainSelectedChunk = useMemo(
    () => selectedChunk !== null && filteredChunks.includes(selectedChunk),
    [filteredChunks, selectedChunk]
  );

  const onFilterTextInputChange = (event: React.ChangeEvent) => {
    setFilterText((event.currentTarget as HTMLInputElement).value);
  };

  const onClearButtonClick = () => {
    setClearBeforeIndex(chunks.length);
  };

  const { internal: isInternalUser } = useGetUserInfo();

  let viewLogLink = null;
  if (isInternalUser) {
    const sessionId = ThreadFront.sessionId;
    const sessionIdPieces = sessionId?.split("/");
    if (sessionIdPieces?.length === 2) {
      const controllerId = sessionIdPieces[0];

      viewLogLink = `${ADMIN_APP_BASE_URL}/${controllerId}`;
    }
  }

  return (
    <div className={styles.Container}>
      <h3 className={styles.Header}>
        Protocol Info
        {viewLogLink != null && (
          <a href={viewLogLink} rel="noreferrer noopener" target="_blank" title="View session logs">
            <MaterialIcon>launch</MaterialIcon>
          </a>
        )}
      </h3>

      <div className={styles.HeaderControls}>
        <input
          className={styles.FilterInput}
          placeholder="Filter"
          value={filterText}
          onChange={onFilterTextInputChange}
        />

        <button
          className={styles.ClearButton}
          disabled={filteredChunks.length === 0}
          title="Clear protocol log"
          onClick={onClearButtonClick}
        >
          <Icon
            filename="trash"
            className={filteredChunks.length === 0 ? styles.ClearIconDisabled : styles.ClearIcon}
          />
        </button>
      </div>

      <div className={styles.Panel}>
        {filteredChunks.map(chunk => (
          <ProtocolChunk
            key={chunk.ids[0]}
            chunk={chunk}
            responseMap={responseMap}
            requestMap={requestMap}
            selectedChunk={selectedChunk}
            setSelectedChunk={setSelectedChunk}
          />
        ))}
      </div>
      {selectedChunk !== null && doesFilteredChunksContainSelectedChunk && (
        <Details
          key={selectedChunk.ids[0]}
          errorMap={errorMap}
          requestMap={requestMap}
          responseMap={responseMap}
          selectedChunk={selectedChunk}
        />
      )}
    </div>
  );
}
