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
export type Discrepancy = ReactComponentDiscrepancyType;
export interface ReactComponentDiscrepancyType {
  eventKind: "ReactComponent";
  kind: "Extra" | "Missing";
  sequenceId: string;
  commonPoint: string;
  event: ReactComponentEvent;
}
export interface Sequence<T> {
  sequenceId: string;
  kind: "Extra" | "Missing";
  discrepancies: T[];
}
interface ReactComponentEvent extends Event {
  nodeName: string;
}
interface Event {
  key: string;
  point: string;
  time: number;
}
