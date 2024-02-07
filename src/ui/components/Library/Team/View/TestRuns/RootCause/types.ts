import {
  ExecutionPoint,
  MappedLocation,
  RequestInitiator,
  TimeStampedPoint,
} from "@replayio/protocol";

export interface Data {
  result: string; // AnalysisResult
  discrepancies: Array<RootCauseAnalysisResult> | undefined;
}

interface RootCauseAnalysisResult {
  // The failed test run which was analyzed.
  failedRun: TestRunInfo;

  // A particular successful run which the discrepancies will be in relation to.
  successRun: TestRunInfo;

  // Additional successful runs which were analyzed.
  additionalSuccessRuns: TestRunInfo[];

  // Discrepancies found while analyzing the failure.
  discrepancies: AnyDiscrepancy[];
}

interface TestRunInfo {
  id: TestId;
  start: TimeStampedPoint;
  end: TimeStampedPoint;
}

interface TestId {
  recordingId: string;
  testId: number;
  attempt: number;
}

export type AnyDiscrepancy =
  | ExecutedStatementDiscrepancy
  | ReactComponentDiscrepancy
  | NetworkEventDiscrepancy;

export type ExecutedStatementDiscrepancy = Discrepancy<ExecutedStatementWithDescription>;
export type ReactComponentDiscrepancy = Discrepancy<ReactComponent>;
export type NetworkEventDiscrepancy = Discrepancy<NetworkEventWithAlternate>;

// Information about a discrepancy identified in a test failure.
export interface Discrepancy<T extends DiscrepancyEvent> {
  // The kind of discrepancy.
  kind: DiscrepancyKind;

  // The kind of underlying event.
  eventKind: string;

  // Any ID for a sequence of discrepancies this is associated with.
  sequenceId: string;

  // Information about the discrepancy. For Extra this describes an event that
  // happened in the failing run, for Missing this describes an event that happened
  // in a particular successful run.
  event: T;

  // Point for the most recent event in the failed run that also matches up with an
  // event in the successful run.
  commonPoint: ExecutionPoint;
}

export interface Sequence<T> {
  sequenceId: string;
  kind: "Extra" | "Missing";
  discrepancies: T[];
}

// Information that must be present in events associated with discrepancies.
export interface DiscrepancyEvent {
  // Point in the associated recording where the event occurred.
  point: ExecutionPoint;
  time: number;

  // Key identifying the event. All events in a run must have distinct keys,
  // and keys between different runs must be comparable.
  key: string;
}

// Kinds of discrepancies that can happen in a test failure.
enum DiscrepancyKind {
  // Something extra happened in the failure but not in any successful run.
  Extra = "Extra",

  // Something didn't happen in the failure but happened in every successful run.
  Missing = "Missing",
}

// Reported discrepancies for executed statements include a description of the
// statement which is either extra or missing in the failed run.
interface ExecutedStatementWithDescription extends ExecutedStatement {
  description?: LocationDescription;
}

// Reported discrepancies for the contents of network requests/responses include
// a description of what the corresponding content is in the other run.
interface NetworkEventWithAlternate extends NetworkEvent {
  alternate?: NetworkEventContents;
}

// Information about a statement that executed within a recording.
interface ExecutedStatement extends DiscrepancyEvent {
  // Location of the statement.
  location: MappedLocation;
}

interface NetworkEvent extends DiscrepancyEvent {
  requestId: string;
  data: NetworkEventContents;
}

type NetworkEventContents = NetworkEventContentsRequest | NetworkEventContentsResponseJSON;

export interface NetworkEventContentsRequest {
  kind: "Request";
  requestUrl: string;
  requestMethod: string;
  requestTag: string | undefined;
  responseCode: number | undefined;
  initiator: RequestInitiator | undefined;
}

export interface NetworkEventContentsResponseJSON {
  kind: "ResponseJSON";

  // Information about the associated request.
  requestUrl: string;
  requestTag: string | undefined;

  // Path to the JSON value being described.
  path: string;

  // Value in the JSON at the associated path.
  value: ComparableValue;
}

type ComparableValue = ComparableValueLiteral | ComparableValueType | ComparableValueAny;

// A specific literal value.
interface ComparableValueLiteral {
  kind: "Literal";
  v: ValueLiteral;
}

type ValueType = "number" | "boolean" | "string" | "array";

// A type of value.
interface ComparableValueType {
  kind: "Type";
  type: ValueType;
}

// Topmost element in the partial order, matches any other value.
interface ComparableValueAny {
  kind: "Any";
}

type ValueArrayLiteral = Array<number | boolean | string>;
type ValueLiteral = number | boolean | string | ValueArrayLiteral;

interface LocationDescription {
  url: string | undefined;
  line: number;
  column: number;
  text?: string;
}

// Information about a react component that was added.
interface ReactComponent extends DiscrepancyEvent {
  nodeName: string;
}
