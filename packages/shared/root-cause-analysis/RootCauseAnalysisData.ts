// Functions and types for Root Cause Analysis data transformations
// This needs to be kept in sync with the logic in the backend

import {
  ExecutionPoint,
  FunctionOutline,
  Header,
  Location,
  MappedLocation,
  Object as ProtocolObject,
  RequestEventInfo,
  RequestInfo,
  RequestInitiator,
  SameLineSourceLocations,
  SourceLocation,
  TimeStampedPoint,
} from "@replayio/protocol";

// Kinds of discrepancies that can happen in a test failure.
export enum DiscrepancyKind {
  // Something extra happened in the failure but not in any successful run.
  Extra = "Extra",

  // Something didn't happen in the failure but happened in every successful run.
  Missing = "Missing",
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

export type EventKind = "ExecutedStatement" | "ReactComponent" | "NetworkEvent" | "CustomEvent";

export interface Sequence<T extends Discrepancy<any>> {
  sequenceId: string;
  kind: "Extra" | "Missing";
  discrepancies: T[];
}

// Information about a discrepancy identified in a test failure.
export interface Discrepancy<T extends DiscrepancyEvent> {
  // The kind of discrepancy.
  kind: DiscrepancyKind;

  // The kind of underlying event.
  eventKind: EventKind;

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

type ValueArrayLiteral = Array<number | boolean | string>;
type ValueLiteral = void | number | boolean | string | ValueArrayLiteral;

// A specific literal value.
interface ComparableValueLiteral {
  kind: "Literal";
  v: ValueLiteral;
}

type ValueType = "undefined" | "number" | "boolean" | "string" | "array";

// A type of value.
interface ComparableValueType {
  kind: "Type";
  type: ValueType;
}

// Topmost element in the partial order, matches any other value.
interface ComparableValueAny {
  kind: "Any";
}

export type ComparableValue = ComparableValueLiteral | ComparableValueType | ComparableValueAny;

export enum AnalysisResult {
  // The analysis ran successfully and produced results.
  Success = "Success",

  // We tried to run the analysis but it had a failure and didn't generate results.
  Failure = "Failure",

  // We decided not to run the analysis for some reason.
  Skipped = "Skipped",
}

export namespace RootCauseAnalysisDataV1 {
  export enum ReactComponentChange {
    Add = "Add",
    Remove = "Remove",
  }

  // Information about a change to a react component.
  export interface ReactComponent extends DiscrepancyEvent {
    nodeName: string;
    change: ReactComponentChange;
  }

  // Information about a statement that executed within a recording.
  export interface ExecutedStatement extends DiscrepancyEvent {
    // Location of the statement.
    location: MappedLocation;
  }

  export interface LocationDescription {
    url: string | undefined;
    line: number;
    column: number;
    frame: Frame;
    functionText?: string[];
    functionOutline?: FunctionOutline;
    text?: string;
  }

  interface Frame {
    functionName: string;
    points: FramePoint[];
    otherPoints: FramePoint[];
  }

  export interface FramePoint {
    hits: number;
    location: Location;
    breakable: boolean;
  }

  // Reported discrepancies for executed statements include a description of the
  // statement which is either extra or missing in the failed run.
  interface ExecutedStatementWithDescription extends ExecutedStatement {
    description?: LocationDescription;
  }

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

  export type NetworkEventContents = NetworkEventContentsRequest | NetworkEventContentsResponseJSON;

  export interface NetworkEvent extends DiscrepancyEvent {
    requestId: string;
    data: NetworkEventContents;
  }

  // Reported discrepancies for the contents of network requests/responses include
  // a description of what the corresponding content is in the other run.
  interface NetworkEventWithAlternate extends NetworkEvent {
    alternate?: NetworkEventContents;
  }

  interface ExecutedStatementDiscrepancySpec {
    kind: "ExecutedStatement";
    discrepancyKind: DiscrepancyKind;
    key: string;
    url: string;
  }

  interface ReactComponentDiscrepancySpec {
    kind: "ReactComponent";
    discrepancyKind: DiscrepancyKind;
    key: string;
  }

  interface NetworkEventDiscrepancySpec {
    kind: "NetworkEvent";
    discrepancyKind: DiscrepancyKind;
    key: string;
  }

  // Discrepancy in the result of a global evaluation at the failure point in the
  // failed vs. passing recordings.
  interface CustomSpecGlobalEval {
    kind: "GlobalEval";
    expression: string;
  }

  // Discrepancy in the result of evaluating an expression at the last time some
  // statement executed before the failure.
  interface CustomSpecFrameEval {
    kind: "FrameEval";
    expression: string;

    // URL where we should look for the source to evaluate the expression.
    url: string;

    // Text for the statement within the URL to evaluate the expression at.
    fragment: string;
  }

  // Specification for a custom discrepancy to check for.
  export type CustomSpec = CustomSpecGlobalEval | CustomSpecFrameEval;

  // Information about an event associated with a custom discrepancy spec.
  export interface CustomEvent extends DiscrepancyEvent {
    // Discrepancy which we checked for.
    custom: CustomSpec;

    // Any value produced by an evaluation in the discrepancy.
    value?: ComparableValue;
  }

  export type ExecutedStatementDiscrepancy = Discrepancy<ExecutedStatementWithDescription>;
  export type ReactComponentDiscrepancy = Discrepancy<ReactComponent>;
  export type NetworkEventDiscrepancy = Discrepancy<NetworkEventWithAlternate>;
  export type CustomEventDiscrepancy = Discrepancy<CustomEvent>;

  export type AnyDiscrepancy =
    | ExecutedStatementDiscrepancy
    | ReactComponentDiscrepancy
    | NetworkEventDiscrepancy
    | CustomEventDiscrepancy;

  // Discrepancies in a signature can be custom specs or describe discrepancies
  // automatically found by the RCA.
  export type DiscrepancySpec =
    | CustomSpec
    | ExecutedStatementDiscrepancySpec
    | ReactComponentDiscrepancySpec
    | NetworkEventDiscrepancySpec;

  export interface TestFailureSignature {
    // Description and associated URL to use for failures matching this signature.
    title: string;
    url: string;

    // Associated priority, with lower numbers being higher priority. If a failure
    // matches multiple signatures then the label used will be the highest priority,
    // or the first one in the signatures array in the case of tied priorities.
    priority: number;

    // Specs for discrepancies matching this signature.
    discrepancies: DiscrepancySpec[];
  }

  // Unique identifier for a test.
  export interface TestId {
    recordingId: string;
    testId: number;
    attempt: number;
  }

  // Describes a test run handled by the root cause analysis.
  export interface TestRunInfo {
    // Test which was analyzed.
    id: TestId;

    // Range of the recording in which the test ran.
    start: TimeStampedPoint;
    end: TimeStampedPoint;

    // Any earlier endpoint for the range which was analyzed.
    analyzeEndpoint?: TimeStampedPoint;

    // In a failed recording, the endpoint at which the last steps were repeated
    // the same number of times as in each passing recording.
    failureRepeatEndpoint?: TimeStampedPoint;
  }

  // Encodes the result of analyzing a flaky test failure.
  export interface RootCauseAnalysisResult {
    // The failed test run which was analyzed.
    failedRun: TestRunInfo;

    // A particular successful run which the discrepancies will be in relation to.
    successRun: TestRunInfo;

    // Additional successful runs which were analyzed.
    additionalSuccessRuns: TestRunInfo[];

    // Discrepancies found while analyzing the failure.
    discrepancies: AnyDiscrepancy[];

    // The highest priority signature which matches this failure, if any.
    matchingSignature?: TestFailureSignature;
  }

  export interface RootCauseAnalysisDatabaseResultV1 {
    branch: string | undefined;
    result: AnalysisResult;
    skipReason: string | undefined;
    error: Record<string, unknown> | undefined;
    discrepancies: RootCauseAnalysisResult[] | undefined;
  }

  export interface RootCauseAnalysisDatabaseJson {
    recording_id: string;
    created_at: string;
    updated_at: string;
    result: RootCauseAnalysisDatabaseResultV1;
    version: 1;
  }
}

export namespace RootCauseAnalysisDataV2 {
  export enum ReactComponentChange {
    Add = "Add",
    Remove = "Remove",
  }

  // Information about a change to a react component.
  export interface ReactComponent extends DiscrepancyEvent {
    nodeName: string;
    change: ReactComponentChange;
  }

  // Information about a statement that executed within a recording.
  export interface ExecutedStatement extends DiscrepancyEvent {
    // Location of the statement.
    location: MappedLocation;
  }

  export interface LocationDescription {
    sourceId: string;
    url: string | undefined;
    line: number;
    column: number;
    functionText?: string[];
    functionOutline?: FunctionOutline;
    text?: string;
  }

  interface Exception {
    // Location of the statement.
    location: MappedLocation;
    // Description of an exception's error, where available.
    error?: ProtocolObject;
  }

  // Information about a location within a frame.
  interface Frame {
    functionName: string;
    points: FramePoint[];
    exceptions?: Exception[];
  }

  // Information about a location within a frame, but with an attached key for the location.
  interface FrameData extends Frame {
    key: string;
  }

  // Information about a location within a frame.
  export interface FramePoint {
    hits: number;
    location: Location;
    breakable: boolean;
  }

  // Reported discrepancies for executed statements include a description of the
  // statement which is either extra or missing in the failed run.
  interface ExecutedStatementWithDescription extends ExecutedStatement {
    description?: LocationDescription;
  }

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

  export type NetworkEventContents = NetworkEventContentsRequest | NetworkEventContentsResponseJSON;

  export interface NetworkEvent extends DiscrepancyEvent {
    requestId: string;
    data: NetworkEventContents;
  }

  // Reported discrepancies for the contents of network requests/responses include
  // a description of what the corresponding content is in the other run.
  interface NetworkEventWithAlternate extends NetworkEvent {
    alternate?: NetworkEventContents;
  }

  interface ExecutedStatementDiscrepancySpec {
    kind: "ExecutedStatement";
    discrepancyKind: DiscrepancyKind;
    key: string;
    url: string;
  }

  interface ReactComponentDiscrepancySpec {
    kind: "ReactComponent";
    discrepancyKind: DiscrepancyKind;
    key: string;
  }

  interface NetworkEventDiscrepancySpec {
    kind: "NetworkEvent";
    discrepancyKind: DiscrepancyKind;
    key: string;
  }

  // Discrepancy in the result of a global evaluation at the failure point in the
  // failed vs. passing recordings.
  interface CustomSpecGlobalEval {
    kind: "GlobalEval";
    expression: string;
  }

  // Discrepancy in the result of evaluating an expression at the last time some
  // statement executed before the failure.
  interface CustomSpecFrameEval {
    kind: "FrameEval";
    expression: string;

    // URL where we should look for the source to evaluate the expression.
    url: string;

    // Text for the statement within the URL to evaluate the expression at.
    fragment: string;
  }

  // Specification for a custom discrepancy to check for.
  export type CustomSpec = CustomSpecGlobalEval | CustomSpecFrameEval;

  // Information about an event associated with a custom discrepancy spec.
  export interface CustomEvent extends DiscrepancyEvent {
    // Discrepancy which we checked for.
    custom: CustomSpec;

    // Any value produced by an evaluation in the discrepancy.
    value?: ComparableValue;
  }

  export type ExecutedStatementDiscrepancy = Discrepancy<ExecutedStatementWithDescription>;
  export type ReactComponentDiscrepancy = Discrepancy<ReactComponent>;
  export type NetworkEventDiscrepancy = Discrepancy<NetworkEventWithAlternate>;
  export type CustomEventDiscrepancy = Discrepancy<CustomEvent>;

  export type AnyDiscrepancy =
    | ExecutedStatementDiscrepancy
    | ReactComponentDiscrepancy
    | NetworkEventDiscrepancy
    | CustomEventDiscrepancy;

  // Discrepancies in a signature can be custom specs or describe discrepancies
  // automatically found by the RCA.
  export type DiscrepancySpec =
    | CustomSpec
    | ExecutedStatementDiscrepancySpec
    | ReactComponentDiscrepancySpec
    | NetworkEventDiscrepancySpec;

  export interface TestFailureSignature {
    // Description and associated URL to use for failures matching this signature.
    title: string;
    url: string;

    // Associated priority, with lower numbers being higher priority. If a failure
    // matches multiple signatures then the label used will be the highest priority,
    // or the first one in the signatures array in the case of tied priorities.
    priority: number;

    // Specs for discrepancies matching this signature.
    discrepancies: DiscrepancySpec[];
  }

  // Unique identifier for a test.
  export interface TestId {
    recordingId: string;
    testId: number;
    attempt: number;
  }

  // Describes a test run handled by the root cause analysis.
  export interface TestRunInfo {
    // Test which was analyzed.
    id: TestId;

    // Range of the recording in which the test ran.
    start: TimeStampedPoint;
    end: TimeStampedPoint;

    // Any earlier endpoint for the range which was analyzed.
    analyzeEndpoint?: TimeStampedPoint;

    // In a failed recording, the endpoint at which the last steps were repeated
    // the same number of times as in each passing recording.
    failureRepeatEndpoint?: TimeStampedPoint;
  }

  // Encodes the result of analyzing a flaky test failure.
  export interface RootCauseAnalysisResult {
    // The failed test run which was analyzed.
    failedRun: TestRunInfo;

    // A particular successful run which the discrepancies will be in relation to.
    successRun: TestRunInfo;

    // Additional successful runs which were analyzed.
    additionalSuccessRuns: TestRunInfo[];

    // Discrepancies found while analyzing the failure.
    discrepancies: AnyDiscrepancy[];

    // Frame data for the failing run.
    failingFrames: FrameData[];

    // Frame data for the passing run.
    passingFrames: FrameData[];

    // The highest priority signature which matches this failure, if any.
    matchingSignature?: TestFailureSignature;
  }

  export interface RootCauseAnalysisDatabaseResultV2 {
    branch: string | undefined;
    result: AnalysisResult;
    skipReason: string | undefined;
    error: Record<string, unknown> | undefined;
    discrepancies: RootCauseAnalysisResult[] | undefined;
  }

  export interface RootCauseAnalysisDatabaseJson {
    recording_id: string;
    created_at: string;
    updated_at: string;
    result: RootCauseAnalysisDatabaseResultV2;
    version: 2;
  }
}

export type AnyRootCauseAnalysisDatabaseJson =
  | RootCauseAnalysisDataV1.RootCauseAnalysisDatabaseJson
  | RootCauseAnalysisDataV2.RootCauseAnalysisDatabaseJson;

export type AnyRootCauseAnalysisDatabaseResult =
  | RootCauseAnalysisDataV1.RootCauseAnalysisDatabaseResultV1
  | RootCauseAnalysisDataV2.RootCauseAnalysisDatabaseResultV2;

export type AnyRootCauseAnalysisResult =
  | RootCauseAnalysisDataV1.RootCauseAnalysisResult
  | RootCauseAnalysisDataV2.RootCauseAnalysisResult;

export function isRootCauseAnalysisDataV1(
  data: AnyRootCauseAnalysisDatabaseJson
): data is RootCauseAnalysisDataV1.RootCauseAnalysisDatabaseJson {
  return data.version === 1;
}

export function isRootCauseAnalysisDataV2(
  data: AnyRootCauseAnalysisDatabaseJson
): data is RootCauseAnalysisDataV2.RootCauseAnalysisDatabaseJson {
  return data.version === 2;
}
