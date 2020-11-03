import {
  BreakpointId,
  ExecutionPoint,
  FrameId,
  getScriptSourceResult,
  Location,
  MappedLocation,
  Message,
  missingRegions,
  ObjectId,
  PauseDescription,
  PointDescription,
  RecordingId,
  SameLineScriptLocations,
  ScreenShot,
  ScriptId,
  ScriptKind,
  ScriptLocation,
  scriptParsed,
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

export interface Script {
  kind: ScriptKind;
  url?: string;
  generatedScriptIds?: ScriptId[];
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
  scripts: Map<string, Script>;
  scriptWaiters: ArrayMap<string, () => void>;
  urlScripts: ArrayMap<string, ScriptId>;
  originalScripts: ArrayMap<ScriptId, ScriptId>;
  preferredGeneratedScripts: Set<ScriptId>;
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
  findScripts(onScript: (script: scriptParsed) => void): Promise<void>;
  getScriptKind(scriptId: ScriptId): ScriptKind | null;
  ensureScript(scriptId: ScriptId): Promise<Script>;
  getScriptURLRaw(scriptId: ScriptId): string | undefined;
  getScriptURL(scriptId: ScriptId): Promise<string | undefined>;
  getScriptIdsForURL(url: string): ScriptId[];
  getScriptSource(scriptId: ScriptId): Promise<getScriptSourceResult>;
  getBreakpointPositionsCompressed(
    scriptId: ScriptId,
    range?: { start: ScriptLocation; end: ScriptLocation }
  ): Promise<SameLineScriptLocations[]>;
  setSkipPausing(skip: boolean): void;
  setBreakpoint(
    scriptId: ScriptId,
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
  removeBreakpoint(scriptId: ScriptId, line: number, column: number): Promise<void>;
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
  blackbox(scriptId: ScriptId, begin: ScriptLocation, end: ScriptLocation): Promise<void>;
  unblackbox(scriptId: ScriptId, begin: ScriptLocation, end: ScriptLocation): Promise<void>;
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
  isMinifiedScript(scriptId: ScriptId): boolean;
  isSourceMappedScript(scriptId: ScriptId): boolean;
  preferScript(scriptId: ScriptId, value: boolean): void;
  hasPreferredGeneratedScript(location: MappedLocation): boolean;
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
