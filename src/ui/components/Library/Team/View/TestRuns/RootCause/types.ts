export interface Data {
  discrepancies: {
    failedRun: Run;
    successRun: Run;
    discrepancies: Discrepancy[];
  }[];
}
interface Run {
  id: {
    recordingId: string;
  };
}
export type Discrepancy = ReactComponentDiscrepancyType | ExecutedStatementDiscrepancyType | NetworkEventDiscrepancyType;
export interface ReactComponentDiscrepancyType {
  eventKind: "ReactComponent";
  kind: "Extra" | "Missing";
  sequenceId: string;
  commonPoint: string;
  event: ReactComponentEvent;
}
export interface ExecutedStatementDiscrepancyType {
  eventKind: "ExecutedStatement";
  kind: "Extra" | "Missing";
  sequenceId: string;
  commonPoint: string;
  event: ExecutedStatementEvent;
}
export type NetworkEventDiscrepancyType = __NetworkEventExtraRequestDiscrepancyType | NetworkEventMissingRequestDiscrepancyType | NetworkEventExtraResponseDiscrepancyType | NetworkEventMissingResponseDiscrepancyType;
export interface __NetworkEventExtraRequestDiscrepancyType {
  eventKind: "NetworkEvent";
  kind: "Extra";
  sequenceId: string;
  commonPoint: string;
  event: __NetworkEventExtraRequestEvent;
}
export interface NetworkEventMissingRequestDiscrepancyType {
  eventKind: "NetworkEvent";
  kind: "Missing";
  sequenceId: string;
  commonPoint: string;
  event: NetworkEventMissingRequestEvent;
}
export interface NetworkEventExtraResponseDiscrepancyType {
  eventKind: "NetworkEvent";
  kind: "Extra";
  sequenceId: string;
  commonPoint: string;
  event: NetworkEventExtraResponseEvent;
}
export interface NetworkEventMissingResponseDiscrepancyType {
  eventKind: "NetworkEvent";
  kind: "Missing";
  sequenceId: string;
  commonPoint: string;
  event: NetworkEventMissingResponseEvent;
}
export interface Sequence<T> {
  sequenceId: string;
  kind: "Extra" | "Missing";
  discrepancies: T[];
}
interface ReactComponentEvent extends Event {
  nodeName: string;
}
interface ExecutedStatementEvent extends Event {
  description: {
    column: number;
    line: number;
    text: string;
    url: string;
  }
}
export interface NetworkEventExtraResponseEvent extends Event {
  requestId: string;
  data: NetworkEventResponseEventData;
  alternate: NetworkEventResponseEventData;
}
export interface NetworkEventMissingResponseEvent extends Event {
  requestId: string;
  data: NetworkEventResponseEventData
}
export interface __NetworkEventExtraRequestEvent extends Event {
  requestId: string;
  data: NetworkEventRequestEventData;
}
export interface NetworkEventMissingRequestEvent extends Event {
  requestId: string;
  data: NetworkEventRequestEventData
}
interface Event {
  key: string;
  point: string;
  time: number;
}
interface NetworkEventResponseEventData {
  kind: "ResponseJSON";
  path: string;
  requestTag: string;
  requestUrl: string;
  value: {
    kind: "Any" | "Literal" | "Type" | string;
    type?: "string" | string;
    v?: string[];
  }
}
interface NetworkEventRequestEventData {
  initiator: {
    url: string;
  };
  kind: "Request";
  requestMethod: "GET" | string;
  requestUrl: string;
}