import {
  BreakpointId,
  ExecutionPoint,
  FrameId,
  getSourceContentsResult,
  Location,
  MappedLocation,
  Message,
  missingRegions,
  ObjectId,
  PauseDescription,
  PointDescription,
  RecordingId,
  SameLineSourceLocations,
  ScreenShot,
  SourceId,
  SourceKind,
  SourceLocation,
  newSource,
  SessionId,
  TimeStamp,
  unprocessedRegions,
} from "record-replay-protocol";
import { MappedLocationCache } from "../mapped-location-cache";
import { ArrayMap, Deferred } from "../utils";
import { NodeBoundsFront } from "./bounds";
import { NodeFront } from "./node";
import { Pause, EvaluationResult, WiredFrame, WiredScope } from "./pause";

export interface RecordingDescription {
  duration: TimeStamp;
  length?: number;
  lastScreen?: ScreenShot;
  commandLineArguments?: string[];
}

export interface Source {
  kind: SourceKind;
  url?: string;
  generatedSourceIds?: SourceId[];
}

export interface PauseEventArgs {
  point: ExecutionPoint;
  time: number;
  hasFrames: boolean;
}

export declare const ThreadFront: {
  actor: string;
  currentPoint: ExecutionPoint;
  currentPointHasFrames: boolean | undefined;
  currentPause: Pause | null;
  asyncPauses: Pause[];
  recordingId: RecordingId | null;
  sessionId: SessionId | null;
  sessionWaiter: Deferred<SessionId>;
  initializedWaiter: Deferred<void>;
  sources: Map<string, Source>;
  sourceWaiters: ArrayMap<string, () => void>;
  urlSources: ArrayMap<string, SourceId>;
  originalSources: ArrayMap<SourceId, SourceId>;
  preferredGeneratedSources: Set<SourceId>;
  mappedLocations: MappedLocationCache;
  skipPausing: boolean;
  resumeTargets: Map<string, PauseDescription>;
  resumeTargetEpoch: number;
  numPendingInvalidateCommands: number;
  invalidateCommandWaiters: (() => void)[];
  allPauses: Map<ExecutionPoint, Pause>;
  breakpoints: Map<BreakpointId, { location: Location }>;
  metadataListeners: { key: string; callback: (newValue: any) => void }[] | undefined;
  warpCallback:
    | ((
        point: ExecutionPoint,
        time: number,
        hasFrames: boolean
      ) => { point: ExecutionPoint; time: number } | null)
    | null;
  setSessionId(sessionId: SessionId): Promise<void>;
  initializeToolbox(): Promise<void>;
  setTest(test: string): void;
  waitForSession(): Promise<string>;
  ensureProcessed(
    onMissingRegions: ((parameters: missingRegions) => void) | undefined,
    onUnprocessedRegions: ((parameters: unprocessedRegions) => void) | undefined
  ): Promise<void>;
  timeWarp(point: ExecutionPoint, time?: number, hasFrames?: boolean, force?: boolean): void;
  findSources(onSource: (source: newSource) => void): Promise<void>;
  getSourceKind(sourceId: SourceId): SourceKind | null;
  ensureSource(sourceId: SourceId): Promise<Source>;
  getSourceURLRaw(sourceId: SourceId): string | undefined;
  getSourceURL(sourceId: SourceId): Promise<string | undefined>;
  getSourceIdsForURL(url: string): SourceId[];
  getSourceSource(sourceId: SourceId): Promise<getSourceContentsResult>;
  getBreakpointPositionsCompressed(
    sourceId: SourceId,
    range?: { start: SourceLocation; end: SourceLocation }
  ): Promise<SameLineSourceLocations[]>;
  setSkipPausing(skip: boolean): void;
  setBreakpoint(
    sourceId: SourceId,
    line: number,
    column: number,
    condition?: string
  ): Promise<void>;
  setBreakpointByURL(
    url: string,
    line: number,
    column: number,
    condition?: string
  ): Promise<void[]> | undefined;
  removeBreakpoint(sourceId: SourceId, line: number, column: number): Promise<void>;
  removeBreakpointByURL(url: string, line: number, column: number): Promise<void[]> | undefined;
  ensurePause(point: ExecutionPoint): Pause;
  ensureCurrentPause(): void;
  getFrames(): Promise<WiredFrame[] | undefined>;
  lastAsyncPause(): Pause;
  loadAsyncParentFrames(): Promise<WiredFrame[]>;
  pauseForAsyncIndex(asyncIndex: number): Pause;
  getScopes(asyncIndex: number, frameId: FrameId): Promise<WiredScope[]>;
  evaluate(asyncIndex: number, frameId: FrameId, text: string): Promise<EvaluationResult>;
  waitForInvalidateCommandsToFinish(): Promise<void> | undefined;
  rewind(point: ExecutionPoint): void;
  resume(point: ExecutionPoint): void;
  reverseStepOver(point: ExecutionPoint): void;
  stepOver(point: ExecutionPoint): void;
  stepIn(point: ExecutionPoint): void;
  stepOut(point: ExecutionPoint): void;
  resumeTarget(point: ExecutionPoint): Promise<PauseDescription>;
  blackbox(sourceId: SourceId, begin: SourceLocation, end: SourceLocation): Promise<void>;
  unblackbox(sourceId: SourceId, begin: SourceLocation, end: SourceLocation): Promise<void>;
  findConsoleMessages(onConsoleMessage: (pause: Pause, message: Message) => void): Promise<void>;
  getRootDOMNode(): Promise<NodeFront | null>;
  getKnownRootDOMNode(): NodeFront;
  searchDOM(query: string): Promise<NodeFront[] | null>;
  loadMouseTargets(): Promise<boolean | undefined>;
  getMouseTarget(x: number, y: number): Promise<NodeBoundsFront | null>;
  ensureNodeLoaded(objectId: ObjectId): Promise<NodeFront | null>;
  getFrameSteps(asyncIndex: number, frameId: FrameId): Promise<PointDescription[]>;
  getPreferredLocationRaw(locations: MappedLocation): Location;
  getPreferredLocation(locations: MappedLocation): Promise<Location>;
  getAlternateLocation(locations: MappedLocation): Promise<Location | null>;
  isMinifiedSource(sourceId: SourceId): boolean;
  isSourceMappedSource(sourceId: SourceId): boolean;
  preferSource(sourceId: SourceId, value: boolean): void;
  hasPreferredGeneratedSource(location: MappedLocation): boolean;
  getPreferredMappedLocation(location: Location): Promise<Location>;
  getRecordingDescription(): Promise<RecordingDescription>;
  watchMetadata(key: string, callback: (args: any) => any): Promise<void>;
  updateMetadata(key: string, callback: (args: any) => any): Promise<void>;

  // added by EventEmitter.decorate(ThreadFront)
  eventListeners: Map<string, ((value?: any) => void)[]>;
  on: (name: string, handler: (value?: any) => void) => void;
  off: (name: string, handler: (value?: any) => void) => void;
  emit: (name: string, value?: any) => void;
};
