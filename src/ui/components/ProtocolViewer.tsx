import classNames from "classnames";
import { padStart } from "lodash";
import { useSelector } from "react-redux";
import { getProtocolRequests, RequestSummary } from "ui/reducers/protocolMessages";

const msAsMinutes = (ms: number) => {
  const seconds = Math.round(ms / 1000.0);
  return `${Math.floor(seconds / 60)}:${padStart(String(seconds % 60), 2, "0")}`;
};

const fullMethod = (request: RequestSummary): string => {
  return `${request.class}.${request.method}`;
};

type RequestSummaryChunk = {
  count: number;
  method: string;
  pending: boolean;
  errored: boolean;
  startedAt: number;
};

type ChunkReducer = {
  chunks: RequestSummaryChunk[];
  current: RequestSummaryChunk;
};

const chunkedRequests = (requests: RequestSummary[]): RequestSummaryChunk[] => {
  return requests.reduce(
    (acc: ChunkReducer, request: RequestSummary) => {
      const { current } = acc;
      if (
        current.method === fullMethod(request) &&
        current.pending === request.pending &&
        current.errored === request.errored
      ) {
        current.count++;
      } else {
        acc.chunks.push(current);
        acc.current = {
          count: 1,
          errored: request.errored,
          method: fullMethod(request),
          pending: request.pending,
          startedAt: request.recordedAt,
        };
      }
      return acc;
    },
    {
      chunks: [],
      current: {
        count: 0,
        method: "",
        pending: false,
        errored: false,
        startedAt: 0,
      },
    }
  ).chunks;
};

const ProtocolViewer = () => {
  const requests = useSelector(getProtocolRequests);
  const chunks = chunkedRequests(requests);

  return (
    <div className="max-h-full overflow-y-scroll p-4">
      <h3 className="text-lg">Protocol Info</h3>
      {chunks.map(chunk => {
        return (
          <div
            key={`${chunk.method}:${chunk.startedAt}`}
            className={classNames("flex justify-between p-1", {
              "text-lightGrey": chunk.pending,
              "text-errorColor": chunk.errored,
            })}
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
  );
};

export default ProtocolViewer;
