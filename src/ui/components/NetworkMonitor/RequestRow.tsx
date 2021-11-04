import { TimeStampedPoint } from "@recordreplay/protocol";
import Status from "./Status";

interface Header {
  name: string;
  value: string;
}

interface RequestOpenEvent {
  kind: "request";
  requestUrl: string;
  requestMethod: string;
  requestHeaders: Header[];
  requestCause: string;
}

interface RequestResponseEvent {
  kind: "response";
  responseHeaders: Header[];
  responseProtocolVersion: string;
  responseStatus: number;
  responseStatusText: string;
  responseFromCache: boolean;
}

type RequestEvent = RequestResponseEvent | RequestOpenEvent;

interface RequestEventInfo {
  id: string;
  time: number;
  event: RequestEvent;
}

interface RequestInfo {
  id: string;
  point: TimeStampedPoint;
}

type RequestRowProps = {
  events: RequestEventInfo[];
  info: RequestInfo;
};

const RequestRow = ({ events, info }: RequestRowProps) => {
  const openEventInfo = events.find(e => e.event.kind === "request");
  const open: RequestOpenEvent | undefined = openEventInfo
    ? (openEventInfo.event as RequestOpenEvent)
    : undefined;
  const responseEventInfo = events.find(e => e.event.kind === "response");
  const response: RequestResponseEvent | undefined = responseEventInfo
    ? (responseEventInfo.event as RequestResponseEvent)
    : undefined;

  if (!(open && response)) {
    return null;
  }

  return (
    <div>
      <Status status={response.responseStatus} />
    </div>
  );
};

export default RequestRow;
