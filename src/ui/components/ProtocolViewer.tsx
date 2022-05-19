import classNames from "classnames";
import { padStart } from "lodash";
import dynamic from "next/dynamic";
import { CommandResponse } from "protocol/socket";
import { useState } from "react";
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
  return requests.reduce(
    (acc: RequestSummaryChunk[], request: RequestSummary) => {
      const current = acc[acc.length - 1];
      if (
        current.method === fullMethod(request) &&
        current.pending === request.pending &&
        current.errored === request.errored
      ) {
        current.count++;
        current.ids.push(request.id);
      } else {
        acc.push({
          count: 1,
          ids: [request.id],
          errored: request.errored,
          method: fullMethod(request),
          pending: request.pending,
          startedAt: request.recordedAt,
        });
      }
      return acc;
    },
    [
      {
        count: 0,
        ids: [],
        method: "",
        pending: false,
        errored: false,
        startedAt: 0,
      },
    ]
  );
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
  const chunks = chunkedRequests(requests);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const selectedRequestDetails = useSelector(getFullRequestDetails(selectedRequests));

  return (
    <div className={styles.Container}>
      <h3 className={styles.Header}>Protocol Info</h3>
      <div className={styles.Panel}>
        {chunks.map(chunk => {
          if (chunk.method === "") {
            return null;
          }

          let className = styles.Chunk;
          if (selectedRequests.join(",") === chunk.ids.join(",")) {
            className = styles.ChunkSelected;
          } else if (chunk.pending) {
            className = styles.ChunkPending;
          } else if (chunk.errored) {
            className = styles.ChunkErrored;
          }

          return (
            <div
              key={`${chunk.method}:${chunk.startedAt}`}
              className={className}
              onClick={() => {
                setSelectedRequests(chunk.ids);
              }}
            >
              <span>
                {chunk.method}
                {chunk.count > 1 ? `(${chunk.count})` : null}
              </span>
              <span>{msAsMinutes(chunk.startedAt)}</span>
            </div>
          );
        })}
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

export default ProtocolViewer;
