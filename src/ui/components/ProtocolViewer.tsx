import { padStart } from "lodash";
import dynamic from "next/dynamic";
import { CommandResponse } from "protocol/socket";
import React, {
  MutableRefObject,
  ReactElement,
  ReactNode,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getTheme } from "ui/reducers/app";
import {
  getProtocolErrorMap,
  getProtocolRequestMap,
  getProtocolResponseMap,
  Recorded,
  RequestSummary,
} from "ui/reducers/protocolMessages";

import styles from "./ProtocolViewer.module.css";
import { PrimarySmButton } from "./shared/Button";

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
});

const MAX_DETAILS_TO_RENDER = 10;
const REQUEST_DURATION_MEDIUM_THRESHOLD_MS = 250;
const REQUEST_DURATION_SLOW_THRESHOLD_MS = 1000;

const msAsMinutes = (ms: number) => {
  const seconds = Math.round(ms / 1000.0);
  return `${Math.floor(seconds / 60)}:${padStart(String(seconds % 60), 2, "0")}`;
};

type RequestSummaryChunk = {
  class: string;
  errored: boolean;
  ids: number[];
  count: number;
  method: string;
  pending: boolean;
  startedAt: number;
};

// Collapses consecutive requests with the same method name and shows the count.
const flattenRequests = (
  requestMap: { [key: number]: RequestSummary },
  responseMap: { [key: number]: CommandResponse & Recorded }
): RequestSummaryChunk[] => {
  const flattened: RequestSummaryChunk[] = [];
  let current: RequestSummaryChunk | null = null;

  for (let id in requestMap) {
    const request = requestMap[id];
    const response = responseMap[id];

    if (current == null || current.class !== request.class || current.method !== request.method) {
      current = {
        class: request.class,
        count: 1,
        errored: request.errored,
        ids: [request.id],
        method: request.method,
        pending: request.pending,
        startedAt: request.recordedAt,
      };

      flattened.push(current);
    } else {
      current.count++;
      current.errored ||= request.errored;
      current.pending ||= request.pending;
      current.ids.push(request.id);
    }
  }

  return flattened;
};

function JSONViewer({ src }: { src: object }) {
  const theme = useSelector(getTheme);

  return (
    <ReactJson
      style={{ backgroundColor: "none" }}
      theme={theme == "light" ? "rjv-default" : "tube"}
      src={src}
      shouldCollapse={false}
      displayDataTypes={false}
      displayObjectSize={false}
    />
  );
}

function ProtocolRequestDetailPanel({
  autoExpand,
  children,
  header,
  subHeader,
}: {
  autoExpand: boolean;
  children: ReactNode;
  header: ReactNode;
  subHeader: ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(autoExpand);

  return (
    <>
      <h3 className={styles.AccordionHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <MaterialIcon iconSize="2xl">{isExpanded ? "arrow_drop_down" : "arrow_right"}</MaterialIcon>
        <span className={styles.AccordionHeaderPrimaryText}>{header}</span>{" "}
        <small className={styles.AccordionHeaderSecondaryText}>{subHeader}</small>
      </h3>
      {isExpanded && children}
    </>
  );
}

function ProtocolRequestDetail({
  error,
  index,
  request,
  response,
}: {
  error: (CommandResponse & Recorded) | undefined;
  index: number;
  request: RequestSummary;
  response: (CommandResponse & Recorded) | undefined;
}) {
  return (
    <>
      <ProtocolRequestDetailPanel
        autoExpand={index === 0}
        header={
          <>
            Request <small>#{index + 1}</small>
          </>
        }
        subHeader={msAsMinutes(request.recordedAt)}
      >
        <JSONViewer src={request} />
        {response && (
          <>
            <h3 className={styles.AccordionSubHeader}>Response</h3>
            <JSONViewer src={response} />
          </>
        )}
        {error && (
          <>
            <h3 className={styles.AccordionSubHeader}>Error</h3>
            <JSONViewer src={error} />
          </>
        )}
      </ProtocolRequestDetailPanel>
    </>
  );
}

export default function ProtocolViewer() {
  const [clearBeforeIndex, setClearBeforeIndex] = useState(0);
  const [filterText, setFilterText] = useState("");
  const deferredFilterText = useDeferredValue(filterText);

  const errorMap = useSelector(getProtocolErrorMap);
  const requestMap = useSelector(getProtocolRequestMap);
  const responseMap = useSelector(getProtocolResponseMap);

  const [selectedChunk, setSelectedChunk] = useState<RequestSummaryChunk | null>(null);

  const chunks = useMemo(() => flattenRequests(requestMap, responseMap), [requestMap, responseMap]);
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

  return (
    <div className={styles.Container}>
      <h3 className={styles.Header}>Protocol Info</h3>

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
        <SelectedRequestDetails
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

function SelectedRequestDetails({
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

function ProtocolChunk({
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

  const durations = chunk.ids.reduce((total, id) => {
    const request = requestMap[id];
    const response = responseMap[id];
    if (request && response) {
      total += response.recordedAt - request.recordedAt;
    }
    return total;
  }, 0);
  const averageDuration = Math.round(durations / chunk.ids.length);

  const selectChunk = () => setSelectedChunk(chunk);

  let durationName = styles.ChunkDurationFast;
  if (averageDuration > REQUEST_DURATION_SLOW_THRESHOLD_MS) {
    durationName = styles.ChunkDurationSlow;
  } else if (averageDuration > REQUEST_DURATION_MEDIUM_THRESHOLD_MS) {
    durationName = styles.ChunkDurationMedium;
  }

  const durationTitle =
    chunk.ids.length > 1 ? `${averageDuration}ms average` : `${Math.round(durations)}ms`;

  return (
    <div ref={ref} className={className} onClick={selectChunk}>
      <span className={styles.ChunkCount}>
        {chunk.count > 1 ? <span className={styles.ChunkCountBadge}>{chunk.count}</span> : null}
      </span>
      <span className={styles.ChunkMethod} title={`${chunk.class}.${chunk.method}`}>
        {chunk.method}
      </span>
      <span className={styles.ChunkStartTime}>{msAsMinutes(chunk.startedAt)}</span>
      <span className={styles.ChunkDuration}>
        {durations > 0 && <div className={durationName} title={durationTitle} />}
      </span>
    </div>
  );
}
