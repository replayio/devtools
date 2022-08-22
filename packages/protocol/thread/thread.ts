// ThreadFront is the main interface used to interact with the singleton
// WRP session. This interface is based on the one normally used when the
// devtools interact with a thread: at any time the thread is either paused
// at a particular point, or resuming on its way to pause at another point.
//
// This model is different from the one used in the WRP, where queries are
// performed on the state at different points in the recording. This layer
// helps with adapting the devtools to the WRP.

import {
  Annotation,
  BreakpointId,
  ExecutionPoint,
  FrameId,
  Location,
  MappedLocation,
  Message,
  missingRegions,
  newSource,
  ObjectId,
  PauseDescription,
  RecordingId,
  ScreenShot,
  SessionId,
  SourceId,
  SourceKind,
  SourceLocation,
  TimeStamp,
  unprocessedRegions,
  loadedRegions as LoadedRegions,
  SameLineSourceLocations,
  RequestEventInfo,
  RequestInfo,
  responseBodyData,
  requestBodyData,
  findAnnotationsResult,
  Frame,
  PointRange,
  PauseId,
  PauseData,
} from "@replayio/protocol";
import groupBy from "lodash/groupBy";

import { MappedLocationCache } from "../mapped-location-cache";
import ScopeMapCache from "../scope-map-cache";
import { client } from "../socket";
import { defer, assert, EventEmitter } from "../utils";

import { Pause } from "./pause";
import { ValueFront } from "./value";

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
  contentHash?: string;
}

export interface PauseEventArgs {
  point: ExecutionPoint;
  time: number;
  hasFrames: boolean;
}

interface FindTargetParameters {
  point: ExecutionPoint;
}
interface FindTargetResult {
  target: PauseDescription;
}
type FindTargetCommand = (
  p: FindTargetParameters,
  sessionId: SessionId
) => Promise<FindTargetResult>;

export type WiredMessage = Omit<Message, "argumentValues"> & {
  argumentValues?: ValueFront[];
};

// Target applications which can create recordings.
export enum RecordingTarget {
  gecko = "gecko",
  chromium = "chromium",
  node = "node",
  unknown = "unknown",
}

function getRecordingTarget(buildId: string): RecordingTarget {
  if (buildId.includes("gecko")) {
    return RecordingTarget.gecko;
  }
  if (buildId.includes("chromium")) {
    return RecordingTarget.chromium;
  }
  if (buildId.includes("node")) {
    return RecordingTarget.node;
  }
  return RecordingTarget.unknown;
}

type ThreadFrontEvent = "currentPause" | "evaluation" | "paused" | "resumed";

declare global {
  interface Window {
    Test?: any;
  }
}

// Temporary experimental feature flag
let repaintAfterEvaluationsExperimentalFlag: boolean = false;
export function setRepaintAfterEvaluationsExperimentalFlag(value: boolean): void {
  repaintAfterEvaluationsExperimentalFlag = value;
}

type LoadedRegionListener = (loadedRegions: LoadedRegions) => void;
class _ThreadFront {
  // When replaying there is only a single thread currently. Use this thread ID
  // everywhere needed throughout the devtools client.
  actor: string = "MainThreadId";

  currentPoint: ExecutionPoint = "0";
  currentTime: number = 0;
  currentPointHasFrames: boolean = false;

  // Any pause for the current point.
  _currentPause: Pause | null = null;

  // Pauses created for async parent frames of the current point.
  asyncPauses: Pause[] = [];

  // Recording ID being examined.
  recordingId: RecordingId | null = null;

  // Waiter for the associated session ID.
  sessionId: SessionId | null = null;
  sessionWaiter = defer<SessionId>();

  // Waiter which resolves with the target used to create the recording.
  recordingTargetWaiter = defer<RecordingTarget>();

  // Waiter which resolves when the debugger has loaded and we've warped to the endpoint.
  initializedWaiter = defer<void>();

  // Waiter which resolves when there is at least one loading region
  loadingHasBegun = defer<void>();

  // Waiter which resolves when all sources have been loaded.
  private allSourcesWaiter = defer<void>();
  hasAllSources = false;

  getCorrespondingSourceIds = (sourceId: SourceId) => [sourceId];

  // Source IDs for generated sources which should be preferred over any
  // original source.
  preferredGeneratedSources = new Set<SourceId>();

  // Map sourceId to breakpoint positions.
  breakpointPositions = new Map<string, Promise<SameLineSourceLocations[]>>();

  mappedLocations = new MappedLocationCache();

  scopeMaps = new ScopeMapCache();

  // Points which will be reached when stepping in various directions from a point.
  resumeTargets = new Map<string, PauseDescription>();

  // Epoch which invalidates step targets when advanced.
  resumeTargetEpoch = 0;

  // How many in flight commands can change resume targets we get from the server.
  numPendingInvalidateCommands = 0;

  // Resolve hooks for promises waiting for pending invalidate commands to finish. wai
  invalidateCommandWaiters: (() => void)[] = [];

  // Map breakpointId to information about the breakpoint, for all installed breakpoints.
  breakpoints = new Map<BreakpointId, { location: Location }>();

  // Wait for all the annotations in the recording.
  private annotationWaiters: Map<string, Promise<findAnnotationsResult>> = new Map();
  private annotationCallbacks: Map<string, ((annotations: Annotation[]) => void)[]> = new Map();

  // added by EventEmitter.decorate(ThreadFront)
  eventListeners!: Map<ThreadFrontEvent, ((value?: any) => void)[]>;
  on!: (name: ThreadFrontEvent, handler: (value?: any) => void) => void;
  off!: (name: ThreadFrontEvent, handler: (value?: any) => void) => void;
  emit!: (name: ThreadFrontEvent, value?: any) => void;

  constructor() {
    client.Session.addAnnotationsListener(({ annotations }: { annotations: Annotation[] }) => {
      const byKind = groupBy(annotations, "kind");
      Object.keys(byKind).forEach(kind => {
        const callbacks = this.annotationCallbacks.get(kind);
        if (callbacks) {
          callbacks.forEach(c => c(byKind[kind]));
        }
        const forAll = this.annotationCallbacks.get("all");
        if (forAll) {
          forAll.forEach(c => c(byKind[kind]));
        }
      });
    });
  }

  get currentPause(): Pause | null {
    return this._currentPause;
  }
  set currentPause(value: Pause | null) {
    this._currentPause = value;

    this.emit("currentPause", value);
  }

  async setSessionId(sessionId: SessionId) {
    this.sessionId = sessionId;
    assert(sessionId, "there should be a sessionId");
    this.sessionWaiter.resolve(sessionId);
    // This helps when trying to debug logRocket sessions and the like
    console.debug({ sessionId });

    const { buildId } = await client.Session.getBuildId({}, sessionId);
    this.recordingTargetWaiter.resolve(getRecordingTarget(buildId));
  }

  waitForSession() {
    return this.sessionWaiter.promise;
  }

  async ensureProcessed(
    level?: "basic",
    onMissingRegions?: ((parameters: missingRegions) => void) | undefined,
    onUnprocessedRegions?: ((parameters: unprocessedRegions) => void) | undefined
  ) {
    const sessionId = await this.waitForSession();

    if (onMissingRegions) {
      client.Session.addMissingRegionsListener(onMissingRegions);
    }

    if (onUnprocessedRegions) {
      client.Session.addUnprocessedRegionsListener(onUnprocessedRegions);
    }

    await client.Session.ensureProcessed({ level }, sessionId);
  }

  private _listeningForLoadChanges: boolean = false;
  private _loadedRegionsListeners: LoadedRegionListener[] = [];
  private _mostRecentLoadedRegions: LoadedRegions | null = null;

  async listenForLoadChanges(listener: LoadedRegionListener) {
    this._loadedRegionsListeners.push(listener);

    if (!this._listeningForLoadChanges) {
      this._listeningForLoadChanges = true;

      const sessionId = await this.waitForSession();

      client.Session.addLoadedRegionsListener((loadedRegions: LoadedRegions) => {
        this._mostRecentLoadedRegions = loadedRegions;

        this.loadingHasBegun.resolve();

        this._loadedRegionsListeners.forEach(callback => callback(loadedRegions));
      });

      client.Session.listenForLoadChanges({}, sessionId);
    } else {
      if (this._mostRecentLoadedRegions !== null) {
        listener(this._mostRecentLoadedRegions);
      }
    }
  }

  async getAnnotations(onAnnotations: (annotations: Annotation[]) => void, kind?: string) {
    const sessionId = await this.waitForSession();
    if (!kind) {
      kind = "all";
    }

    if (!this.annotationCallbacks.has(kind)) {
      this.annotationCallbacks.set(kind, [onAnnotations]);
    } else {
      this.annotationCallbacks.get(kind)!.push(onAnnotations);
    }
    if (kind) {
      if (!this.annotationWaiters.has(kind)) {
        this.annotationWaiters.set(
          kind,
          new Promise(async (resolve, reject) => {
            try {
              const rv: Annotation[] = [];
              await client.Session.findAnnotations(kind === "all" ? {} : { kind }, sessionId);
              resolve(rv);
            } catch (e) {
              reject(e);
            }
          })
        );
      }
      return this.annotationWaiters.get(kind)!;
    }
  }

  _accessToken: string | null = null;

  getAccessToken(): string | null {
    return this._accessToken;
  }

  setAccessToken(accessToken: string) {
    this._accessToken = accessToken;

    return client.Authentication.setAccessToken({ accessToken });
  }

  getRecordingTarget(): Promise<RecordingTarget> {
    return this.recordingTargetWaiter.promise;
  }

  timeWarp(point: ExecutionPoint, time: number, hasFrames?: boolean, frame?: Frame) {
    this.currentPoint = point;
    this.currentTime = time;
    this.currentPointHasFrames = !!hasFrames;
    this.currentPause = null;
    this.asyncPauses.length = 0;
    this.emit("paused", { point, hasFrames, time, frame });
  }

  timeWarpToPause(pause: Pause) {
    const { point, time, hasFrames } = pause;
    assert(
      point && time && typeof hasFrames === "boolean",
      "point, time or hasFrames not set on pause"
    );
    this.currentPoint = point;
    this.currentTime = time;
    this.currentPointHasFrames = hasFrames;
    this.currentPause = pause;
    this.asyncPauses.length = 0;
    this.emit("paused", { point, hasFrames, time });
  }

  async findSources(onSource: (source: newSource) => void) {
    const sessionId = await this.waitForSession();

    const allSources: newSource[] = [];
    client.Debugger.findSources({}, sessionId).then(() => {
      this.hasAllSources = true;
      this.allSourcesWaiter.resolve();
    });
    client.Debugger.addNewSourceListener(source => {
      allSources.push(source);
    });

    await this.ensureAllSources();
    for (const source of allSources) {
      onSource(source);
    }
  }

  async ensureAllSources() {
    await this.allSourcesWaiter.promise;
  }

  getBreakpointPositionsCompressed(
    sourceId: SourceId,
    range?: { start: SourceLocation; end: SourceLocation }
  ) {
    let breakpointPositionsPromise = this.breakpointPositions.get(sourceId);
    if (!breakpointPositionsPromise) {
      breakpointPositionsPromise = this._getBreakpointPositionsCompressed(sourceId, range);
      if (!range) {
        this.breakpointPositions.set(sourceId, breakpointPositionsPromise);
      }
    }
    return breakpointPositionsPromise;
  }

  private async _getBreakpointPositionsCompressed(
    sourceId: SourceId,
    range?: { start: SourceLocation; end: SourceLocation }
  ) {
    assert(this.sessionId, "no sessionId");
    const begin = range ? range.start : undefined;
    const end = range ? range.end : undefined;
    const { lineLocations } = await client.Debugger.getPossibleBreakpoints(
      { sourceId, begin, end },
      this.sessionId
    );
    return lineLocations;
  }

  async setBreakpoint(sourceId: SourceId, line: number, column: number, condition?: string) {
    try {
      this._invalidateResumeTargets(async () => {
        assert(this.sessionId, "no sessionId");
        await this.getBreakpointPositionsCompressed(sourceId);
        const location = { sourceId, line, column };
        const { breakpointId } = await client.Debugger.setBreakpoint(
          { location, condition },
          this.sessionId!
        );
        if (breakpointId) {
          this.breakpoints.set(breakpointId, { location });
        }
      });
    } catch (e) {
      // An error will be generated if the breakpoint location is not valid for
      // this source. We don't keep precise track of which locations are valid
      // for which inline sources in an HTML file (which share the same URL),
      // so ignore these errors.
    }
  }

  async removeBreakpoint(sourceId: SourceId, line: number, column: number) {
    for (const [breakpointId, { location }] of this.breakpoints.entries()) {
      if (sourceId === location.sourceId && location.line == line && location.column == column) {
        this.breakpoints.delete(breakpointId);
        this._invalidateResumeTargets(async () => {
          assert(this.sessionId, "no sessionId");
          await client.Debugger.removeBreakpoint({ breakpointId }, this.sessionId);
        });
      }
    }
  }

  ensurePause(point: ExecutionPoint, time: number) {
    assert(this.sessionId, "no sessionId");
    let pause = Pause.getByPoint(point);
    if (pause) {
      return pause;
    }
    pause = new Pause(this);
    pause.create(point, time);
    return pause;
  }

  getCurrentPause() {
    if (!this.currentPause) {
      this.currentPause = this.ensurePause(this.currentPoint, this.currentTime);
    }
    return this.currentPause;
  }

  instantiatePause(
    pauseId: PauseId,
    point: ExecutionPoint,
    time: number,
    hasFrames: boolean,
    data: PauseData = {}
  ) {
    let pause = Pause.getByPoint(point);
    if (pause) {
      return pause;
    }
    pause = new Pause(this);
    pause.instantiate(pauseId, point, time, hasFrames, data);
    return pause;
  }

  async getFrames() {
    if (!this.currentPointHasFrames) {
      return [];
    }

    return await this.getCurrentPause().getFrames();
  }

  lastAsyncPause() {
    return this.asyncPauses.length
      ? this.asyncPauses[this.asyncPauses.length - 1]
      : this.getCurrentPause();
  }

  async loadAsyncParentFrames() {
    await this.getCurrentPause().ensureLoaded();
    const basePause = this.lastAsyncPause();
    assert(basePause, "no lastAsyncPause");
    const baseFrames = await basePause.getFrames();
    if (!baseFrames) {
      return [];
    }
    const steps = await basePause.getFrameSteps(baseFrames[baseFrames.length - 1].frameId);
    if (basePause != this.lastAsyncPause()) {
      return [];
    }
    const entryPause = this.ensurePause(steps[0].point, steps[0].time);
    this.asyncPauses.push(entryPause);
    const frames = await entryPause.getFrames();
    if (entryPause != this.lastAsyncPause()) {
      return [];
    }
    assert(frames, "no frames");
    return frames.slice(1);
  }

  async pauseForAsyncIndex(asyncIndex?: number) {
    const pause = asyncIndex ? this.asyncPauses[asyncIndex - 1] : this.getCurrentPause();
    assert(pause, "no pause for given asyncIndex");
    return pause;
  }

  async getScopes(asyncIndex: number, frameId: FrameId) {
    const pause = await this.pauseForAsyncIndex(asyncIndex);
    assert(pause, "no pause for asyncIndex");
    return await pause.getScopes(frameId);
  }

  getScopeMap(location: Location): Promise<Record<string, string>> {
    return this.scopeMaps.getScopeMap(location);
  }

  async evaluate({
    asyncIndex,
    text,
    frameId,
    pure = false,
  }: {
    asyncIndex?: number;
    text: string;
    frameId?: FrameId;
    pure?: boolean;
  }) {
    const pause = await this.pauseForAsyncIndex(asyncIndex);
    assert(pause, "no pause for asyncIndex");

    const rv = await pause.evaluate(frameId, text, pure);
    if (rv.returned) {
      rv.returned = new ValueFront(pause, rv.returned);
    } else if (rv.exception) {
      rv.exception = new ValueFront(pause, rv.exception);
    }

    if (repaintAfterEvaluationsExperimentalFlag) {
      const { repaint } = await import("protocol/graphics");
      repaint(true);
    }

    return rv;
  }

  // Perform an operation that will change our cached targets about where resume
  // operations will finish.
  private async _invalidateResumeTargets(callback: () => Promise<void>) {
    this.resumeTargets.clear();
    this.resumeTargetEpoch++;
    this.numPendingInvalidateCommands++;

    try {
      await callback();
    } finally {
      if (--this.numPendingInvalidateCommands == 0) {
        this.invalidateCommandWaiters.forEach(resolve => resolve());
        this.invalidateCommandWaiters.length = 0;
      }
    }
  }

  // Wait for any in flight invalidation commands to finish. Note: currently
  // this is only used during tests. Uses could be expanded to ensure that we
  // don't perform resumes until all invalidating commands have settled, though
  // this risks slowing things down and/or getting stuck if the server is having
  // a problem.
  waitForInvalidateCommandsToFinish() {
    if (!this.numPendingInvalidateCommands) {
      return;
    }
    const { promise, resolve } = defer<void>();
    this.invalidateCommandWaiters.push(resolve as () => void);
    return promise;
  }

  findStepInTarget(point: ExecutionPoint) {
    return client.Debugger.findStepInTarget({ point }, this.sessionId!);
  }

  private async _findResumeTarget(point: ExecutionPoint, command: FindTargetCommand) {
    assert(this.sessionId, "no sessionId");
    await this.ensureAllSources();

    // Check already-known resume targets.
    const key = `${point}:${command.name}`;
    const knownTarget = this.resumeTargets.get(key);
    if (knownTarget) {
      return knownTarget;
    }

    const epoch = this.resumeTargetEpoch;
    const { target } = await command({ point }, this.sessionId);
    if (epoch == this.resumeTargetEpoch) {
      this.updateMappedLocation(target.frame);
      this.resumeTargets.set(key, target);
    }

    return target;
  }

  private async _resumeOperation(
    command: FindTargetCommand,
    selectedPoint: ExecutionPoint,
    loadedRegions: LoadedRegions
  ) {
    // Don't allow resumes until we've finished loading and did the initial
    // warp to the endpoint.
    await this.initializedWaiter.promise;

    let resumeEmitted = false;
    let resumeTarget: PauseDescription | null = null;

    const warpToTarget = () => {
      const { point, time, frame } = resumeTarget!;
      this.timeWarp(point, time, !!frame);
    };

    setTimeout(() => {
      resumeEmitted = true;
      this.emit("resumed");
      if (resumeTarget) {
        setTimeout(warpToTarget, 0);
      }
    }, 0);

    const point = selectedPoint || this.currentPoint;
    try {
      resumeTarget = await this._findResumeTarget(point, command);
    } catch {
      this.emit("paused", {
        point: this.currentPoint,
        hasFrames: this.currentPointHasFrames,
        time: this.currentTime,
      });
    }
    if (
      resumeTarget &&
      loadedRegions.loaded.every(
        region => resumeTarget!.time < region.begin.time || resumeTarget!.time > region.end.time
      )
    ) {
      resumeTarget = null;
    }
    if (resumeTarget && resumeEmitted) {
      warpToTarget();
    }
  }

  rewind(point: ExecutionPoint, loadedRegions: LoadedRegions) {
    this._resumeOperation(client.Debugger.findRewindTarget, point, loadedRegions);
  }
  resume(point: ExecutionPoint, loadedRegions: LoadedRegions) {
    this._resumeOperation(client.Debugger.findResumeTarget, point, loadedRegions);
  }
  reverseStepOver(point: ExecutionPoint, loadedRegions: LoadedRegions) {
    this._resumeOperation(client.Debugger.findReverseStepOverTarget, point, loadedRegions);
  }
  stepOver(point: ExecutionPoint, loadedRegions: LoadedRegions) {
    this._resumeOperation(client.Debugger.findStepOverTarget, point, loadedRegions);
  }
  stepIn(point: ExecutionPoint, loadedRegions: LoadedRegions) {
    this._resumeOperation(client.Debugger.findStepInTarget, point, loadedRegions);
  }
  stepOut(point: ExecutionPoint, loadedRegions: LoadedRegions) {
    this._resumeOperation(client.Debugger.findStepOutTarget, point, loadedRegions);
  }

  async resumeTarget(point: ExecutionPoint) {
    await this.initializedWaiter.promise;
    return this._findResumeTarget(point, client.Debugger.findResumeTarget);
  }

  async findNetworkRequests(
    onRequestsReceived: (data: { requests: RequestInfo[]; events: RequestEventInfo[] }) => void,
    onResponseBodyData: (body: responseBodyData) => void,
    onRequestBodyData: (body: requestBodyData) => void
  ) {
    const sessionId = await this.waitForSession();
    client.Network.addRequestsListener(onRequestsReceived);
    client.Network.addResponseBodyDataListener(onResponseBodyData);
    client.Network.addRequestBodyDataListener(onRequestBodyData);
    client.Network.findRequests({}, sessionId);
  }

  findMessagesInRange(range: PointRange) {
    return client.Console.findMessagesInRange({ range }, ThreadFront.sessionId!);
  }

  async findConsoleMessages(
    onConsoleMessage: (pause: Pause, message: WiredMessage) => void,
    onConsoleOverflow: () => void
  ) {
    await this.ensureProcessed("basic");
    client.Console.addNewMessageListener(async ({ message }) => {
      await this.ensureAllSources();
      const pause = wireUpMessage(message);
      onConsoleMessage(pause, message as WiredMessage);
    });

    return client.Console.findMessages({}, this.sessionId!).then(({ overflow }) => {
      if (overflow) {
        console.warn("Too many console messages, not all will be shown");
        onConsoleOverflow();
      }
    });
  }

  async getRootDOMNode() {
    if (!this.sessionId) {
      return null;
    }
    const pause = this.getCurrentPause();
    await pause.ensureLoaded();
    await pause.loadDocument();
    return pause == this.currentPause ? this.getKnownRootDOMNode() : null;
  }

  getKnownRootDOMNode() {
    assert(this.currentPause?.documentNode !== undefined, "no documentNode for current pause");
    return this.currentPause.documentNode;
  }

  async searchDOM(query: string) {
    if (!this.sessionId) {
      return [];
    }
    const pause = this.getCurrentPause();
    await pause.ensureLoaded();
    const nodes = await pause.searchDOM(query);
    return pause == this.currentPause ? nodes : null;
  }

  async loadMouseTargets() {
    if (!this.sessionId) {
      return;
    }
    const pause = this.getCurrentPause();
    await pause.ensureLoaded();
    await pause.loadMouseTargets();
    return pause == this.currentPause;
  }

  async getMouseTarget(x: number, y: number, nodeIds?: string[]) {
    if (!this.sessionId) {
      return null;
    }
    const pause = this.getCurrentPause();
    await pause.ensureLoaded();
    const nodeBounds = await pause.getMouseTarget(x, y, nodeIds);
    return pause == this.currentPause ? nodeBounds : null;
  }

  async ensureNodeLoaded(objectId: ObjectId) {
    const pause = this.getCurrentPause();
    await pause.ensureLoaded();
    const node = await pause.ensureDOMFrontAndParents(objectId);
    return pause == this.currentPause ? node : null;
  }

  async getFrameSteps(asyncIndex: number, frameId: FrameId) {
    const pause = await this.pauseForAsyncIndex(asyncIndex);
    return pause.getFrameSteps(frameId);
  }

  preferSource(sourceId: SourceId, value: boolean) {
    if (value) {
      this.preferredGeneratedSources.add(sourceId);
    } else {
      this.preferredGeneratedSources.delete(sourceId);
    }
  }

  hasPreferredGeneratedSource(location: MappedLocation) {
    return location.some(({ sourceId }) => {
      return this.preferredGeneratedSources.has(sourceId);
    });
  }

  // Replace the sourceId in a location with the first corresponding sourceId
  updateLocation(location: Location) {
    location.sourceId = this.getCorrespondingSourceIds(location.sourceId)[0];
  }

  // Replace all sourceIds in a mapped location with the first corresponding sourceId
  updateMappedLocation(mappedLocation: MappedLocation | undefined) {
    if (!mappedLocation) {
      return;
    }
    for (const location of mappedLocation) {
      this.updateLocation(location);
    }
  }
}

export const ThreadFront = new _ThreadFront();
EventEmitter.decorate<any, ThreadFrontEvent>(ThreadFront);

export function wireUpMessage(message: Message): Pause {
  const wiredMessage = message as WiredMessage;

  const pause = ThreadFront.instantiatePause(
    message.pauseId,
    message.point.point,
    message.point.time,
    !!message.point.frame,
    message.data
  );

  if (message.argumentValues) {
    wiredMessage.argumentValues = message.argumentValues.map(value => new ValueFront(pause, value));
  }

  ThreadFront.updateMappedLocation(message.point.frame);

  if (message.sourceId) {
    message.sourceId = ThreadFront.getCorrespondingSourceIds(message.sourceId)[0];
  }

  return pause;
}
