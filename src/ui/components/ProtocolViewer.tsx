import { filter, padStart } from "lodash";
import dynamic from "next/dynamic";
import { CommandResponse } from "protocol/socket";
import React, {
  MutableRefObject,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import Icon from "ui/components/shared/Icon";
import { getTheme } from "ui/reducers/app";
import {
  getFullRequestDetails,
  getProtocolRequestsMap,
  getProtocolResponseMap,
  Recorded,
  RequestSummary,
} from "ui/reducers/protocolMessages";

import styles from "./ProtocolViewer.module.css";

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
});

const msAsMinutes = (ms: number) => {
  const seconds = Math.round(ms / 1000.0);
  return `${Math.floor(seconds / 60)}:${padStart(String(seconds % 60), 2, "0")}`;
};

const fullMethod = (request: RequestSummary): string => {
  return `${request.class}.${request.method}`;
};

type RequestSummaryChunk = {
  ids: number[];
  count: number;
  method: string;
  pending: boolean;
  errored: boolean;
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

    if (current == null || current.method !== fullMethod(request)) {
      current = {
        count: 1,
        ids: [request.id],
        errored: request.errored,
        method: fullMethod(request),
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

const JSONViewer = ({ src }: { src: object }) => {
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
};

const ProtocolRequestDetail = ({
  request,
  response,
  error,
}: {
  request: RequestSummary;
  response: (CommandResponse & Recorded) | undefined;
  error: (CommandResponse & Recorded) | undefined;
}) => {
  return (
    <>
      <h3 className={styles.SubHeader}>Request</h3>
      <div className={styles.Panel}>
        <JSONViewer src={request} />
      </div>
      {response && (
        <>
          <h3 className={styles.SubHeader}>Response</h3>
          <div className={styles.Panel}>
            <JSONViewer src={response} />
          </div>
        </>
      )}
      {error && (
        <>
          <h3 className={styles.SubHeader}>Error</h3>
          <div className={styles.Panel}>
            <JSONViewer src={error} />
          </div>
        </>
      )}
    </>
  );
};

interface RequestTimings {
  startTime: number;
  stopTime: number;
}

const ProtocolViewer = () => {
  const requestIdToTimingMap: Map<number, RequestTimings> = useMemo(() => new Map(), []);

  const [clearBeforeIndex, setClearBeforeIndex] = useState(0);
  const [filterText, setFilterText] = useState("");
  const deferredFilterText = useDeferredValue(filterText);

  const requestsMap = useSelector(getProtocolRequestsMap);
  const responseMap = useSelector(getProtocolResponseMap);

  const chunks = useMemo(
    () => flattenRequests(requestsMap, responseMap),
    [requestsMap, responseMap]
  );
  const filteredChunks = useMemo(
    () =>
      chunks.slice(clearBeforeIndex).filter(chunk => {
        return chunk.method.includes(deferredFilterText);
      }),
    [chunks, clearBeforeIndex, deferredFilterText]
  );

  const [selectedChunk, setSelectedChunk] = useState<RequestSummaryChunk | null>(null);
  const selectedRequestDetails = useSelector(getFullRequestDetails(selectedChunk?.ids ?? []));

  const onFilterTextInputChange = (event: React.ChangeEvent) => {
    setFilterText((event.currentTarget as HTMLInputElement).value);
  };

  const onClearButtonClick = () => {
    setClearBeforeIndex(chunks.length);
  };

  // TODO [bvaughn] Chunk and show collapsed count (1)
  // TODO [bvaughn] Could use color for duration (and tooltip on hover)
  // TODO [bvaughn] Maybe hide the domain (e.g. "Console") and show on hover
  // TODO [bvaughn] Track down performance rendering problem

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
            key={`${chunk.method}:${chunk.startedAt}`}
            chunk={chunk}
            selectedChunk={selectedChunk}
            setSelectedChunk={setSelectedChunk}
          />
        ))}
      </div>
      {selectedRequestDetails.length > 0 && (
        <div className={styles.Details}>
          {selectedRequestDetails.map(({ request, response, error }) => {
            return (
              <ProtocolRequestDetail
                key={request!.id}
                request={request!}
                response={response}
                error={error}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

function ProtocolChunk({
  chunk,
  selectedChunk,
  setSelectedChunk,
}: {
  chunk: RequestSummaryChunk;
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

  return (
    <div ref={ref} className={className} onClick={() => setSelectedChunk(chunk)}>
      <span>
        {chunk.method}
        {chunk.count > 1 ? `(${chunk.count})` : null}
      </span>
      <span>{msAsMinutes(chunk.startedAt)}</span>
    </div>
  );
}

export default ProtocolViewer;
