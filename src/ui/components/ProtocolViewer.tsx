import classNames from "classnames";
import { padStart } from "lodash";
import dynamic from "next/dynamic";
import { CommandResponse } from "protocol/socket";
import { MutableRefObject, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { getTheme } from "ui/reducers/app";
import {
  getFullRequestDetails,
  getProtocolRequests,
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

// Group requests by common properties, if they are the same method, the same
// status, and next to each other, then we push them into a `chunk` together
const chunkedRequests = (requests: RequestSummary[]): RequestSummaryChunk[] => {
  return requests.reduce((accumulated: RequestSummaryChunk[], request: RequestSummary) => {
    const current = accumulated[accumulated.length - 1];

    if (
      current == null ||
      current.method !== fullMethod(request) ||
      current.pending !== request.pending ||
      current.errored !== request.errored
    ) {
      accumulated.push({
        count: 1,
        ids: [request.id],
        errored: request.errored,
        method: fullMethod(request),
        pending: request.pending,
        startedAt: request.recordedAt,
      });
    } else {
      current.count++;
      current.ids.push(request.id);
    }

    return accumulated;
  }, []);
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
      <h3 className={styles.Header}>Request</h3>
      <div className={styles.Panel}>
        <JSONViewer src={request} />
      </div>
      {response && (
        <>
          <h3 className={styles.Header}>Response</h3>
          <div className={styles.Panel}>
            <JSONViewer src={response} />
          </div>
        </>
      )}
      {error && (
        <>
          <h3 className={styles.Header}>Error</h3>
          <div className={styles.Panel}>
            <JSONViewer src={error} />
          </div>
        </>
      )}
    </>
  );
};

const ProtocolViewer = () => {
  const requests = useSelector(getProtocolRequests);
  const chunks = useMemo(() => chunkedRequests(requests), [requests]);
  const [selectedChunk, setSelectedChunk] = useState<RequestSummaryChunk | null>(null);
  const selectedRequestDetails = useSelector(getFullRequestDetails(selectedChunk?.ids ?? []));

  return (
    <div className={styles.Container}>
      <h3 className={styles.Header}>Protocol Info</h3>
      <div className={styles.Panel}>
        {chunks.map(chunk => (
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
  } else if (chunk.pending) {
    className = styles.ChunkPending;
  } else if (chunk.errored) {
    className = styles.ChunkErrored;
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
