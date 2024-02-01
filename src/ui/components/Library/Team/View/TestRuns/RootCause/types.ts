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
export type Discrepancy = ReactComponentDiscrepancyType | ExecutedStatementDiscrepancyType;
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
interface Event {
  key: string;
  point: string;
  time: number;
}
