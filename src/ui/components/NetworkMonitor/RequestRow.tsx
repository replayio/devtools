import { TimeStampedPoint } from "@recordreplay/protocol";
import Status from "./Status";
import classNames from "classnames/bind";
import css from "./RequestRow.module.css";
import { cs } from "date-fns/locale";
import { repeat } from "lodash";
const cx = classNames.bind(css);

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

export type RequestEvent = RequestResponseEvent | RequestOpenEvent;

export interface RequestEventInfo {
  id: string;
  time: number;
  event: RequestEvent;
}

export interface RequestInfo {
  id: string;
  point: TimeStampedPoint;
}

export type RequestRowProps = {
  events: RequestEventInfo[];
  info: RequestInfo;
};

const RequestRow = ({ events }: RequestRowProps) => {
  const openEventInfo = events.find(e => e.event.kind === "request");
  const responseEventInfo = events.find(e => e.event.kind === "response");
  if (!(openEventInfo && responseEventInfo)) {
    return null;
  }
  // I thought tsc would figure these types out, apparently not!
  const open: RequestOpenEvent = openEventInfo.event as RequestOpenEvent;
  const response: RequestResponseEvent = responseEventInfo.event as RequestResponseEvent;

  return (
    <div className={cx("request-row border flex items-center")}>
      <div className={cx("column border-r")}>
        <Status status={response.responseStatus} />
      </div>
      <div className={cx("column ")}>{open.requestUrl}</div>
    </div>
  );
};

export default RequestRow;
