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
  ExecutionPoint,
  Frame,
  FrameId,
  loadedRegions as LoadedRegions,
  Location,
  MappedLocation,
  PauseDescription,
  PauseId,
  RecordingId,
  RequestEventInfo,
  RequestInfo,
  ScreenShot,
  SessionId,
  SourceId,
  SourceKind,
  SourceLocation,
  TimeStamp,
  TimeStampedPointRange,
  Value,
  findAnnotationsResult,
  requestBodyData,
  responseBodyData,
} from "@replayio/protocol";
import groupBy from "lodash/groupBy";

import { cachePauseData, pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { areRangesEqual } from "replay-next/src/utils/time";
import { ReplayClientInterface } from "shared/client/types";
import type { Features } from "ui/utils/prefs";

import { client } from "../socket";
import { EventEmitter, assert, defer, locationsInclude } from "../utils";

export interface RecordingDescription {
  duration: TimeStamp;
  length?: number;
  lastScreen?: ScreenShot;
  commandLineArguments?: string[];
}

export interface Pause {
  point: ExecutionPoint;
  time: number;
  pauseId: PauseId | null;
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
  openSource: boolean;
}

export interface ResumeOperationParams {
  point?: ExecutionPoint;
  loadedRegions: LoadedRegions;
  sourceId?: SourceId;
  locationsToSkip?: SourceLocation[];
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

export type RecordingCapabilities = {
  supportsEagerEvaluation: boolean;
  supportsElementsInspector: boolean;
  supportsEventTypes: boolean;
  supportsNetworkRequests: boolean;
  supportsRepaintingGraphics: boolean;
  supportsPureEvaluation: boolean;
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

type ThreadFrontEvent = "paused" | "resumed";

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
  currentPoint: ExecutionPoint = "0";
  currentTime: number = 0;
  private currentPauseId: PauseId | null = null;

  // Recording ID being examined.
  recordingId: RecordingId | null = null;

  // Waiter for the associated session ID.
  sessionId: SessionId | null = null;
  sessionWaiter = defer<SessionId>();

  // Waiter which resolves with the target used to create the recording.
  recordingCapabilitiesWaiter = defer<RecordingCapabilities>();
  recordingTargetWaiter = defer<RecordingTarget>();

  initialFocusRegionWaiter = defer<TimeStampedPointRange>();

  // Waiter which resolves when all sources have been loaded.
  private allSourcesWaiter = defer<void>();

  // The following group of methods is injected by the legacy devtools client.
  // By default, they are essentially no-ops (safe to call but useless).
  // They require information from the application's Redux state to be useful.
  getCorrespondingSourceIds = (sourceId: SourceId) => [sourceId];
  isOriginalSource = (_: SourceId) => false;
  isPrettyPrintedSource = (_: SourceId) => false;

  // Points which will be reached when stepping in various directions from a point.
  resumeTargets = new Map<string, PauseDescription>();

  // Epoch which invalidates step targets when advanced.
  resumeTargetEpoch = 0;

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

  /**
   * This may be null if the pauseId for the current execution point hasn't been
   * received from the backend yet. Use `await getCurrentPauseId()` instead if possible.
   */
  get currentPauseIdUnsafe() {
    return (
      this.currentPauseId ??
      pauseIdCache.getValueIfCached(null as any, this.currentPoint, this.currentTime) ??
      null
    );
  }

  async getCurrentPauseId(replayClient: ReplayClientInterface): Promise<PauseId> {
    return (
      this.currentPauseId ??
      (await pauseIdCache.readAsync(replayClient, this.currentPoint, this.currentTime))
    );
  }

  async setSessionId(sessionId: SessionId, features: Partial<Features>) {
    this.sessionId = sessionId;
    assert(sessionId, "there should be a sessionId");
    this.sessionWaiter.resolve(sessionId);
    // This helps when trying to debug logRocket sessions and the like
    console.debug({ sessionId });

    const { buildId } = await client.Session.getBuildId({}, sessionId);

    const recordingTarget = getRecordingTarget(buildId);

    let recordingCapabilities: RecordingCapabilities;
    switch (recordingTarget) {
      case "chromium": {
        recordingCapabilities = {
          supportsEagerEvaluation: false,
          supportsElementsInspector: true,
          supportsEventTypes: true,
          supportsNetworkRequests: false,
          supportsRepaintingGraphics: features.chromiumRepaints ?? false,
          supportsPureEvaluation: false,
        };

        break;
      }
      case "gecko": {
        recordingCapabilities = {
          supportsEagerEvaluation: true,
          supportsElementsInspector: true,
          supportsEventTypes: true,
          supportsNetworkRequests: true,
          supportsRepaintingGraphics: true,
          supportsPureEvaluation: true,
        };
        break;
      }
      case "node": {
        recordingCapabilities = {
          supportsEagerEvaluation: true,
          supportsElementsInspector: false,
          supportsEventTypes: false,
          supportsNetworkRequests: true,
          supportsRepaintingGraphics: false,
          supportsPureEvaluation: false,
        };
        break;
      }
      case "unknown":
      default: {
        recordingCapabilities = {
          supportsEagerEvaluation: false,
          supportsElementsInspector: false,
          supportsEventTypes: false,
          supportsNetworkRequests: false,
          supportsRepaintingGraphics: false,
          supportsPureEvaluation: false,
        };
      }
    }

    this.recordingCapabilitiesWaiter.resolve(recordingCapabilities);
    this.recordingTargetWaiter.resolve(recordingTarget);
  }

  waitForSession() {
    return this.sessionWaiter.promise;
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

        if (areRangesEqual(loadedRegions.indexed, loadedRegions.loading)) {
          assert(
            loadedRegions.loading.length === 1,
            "there should be exactly one initially loaded region"
          );
          this.initialFocusRegionWaiter.resolve(loadedRegions.loading[0]);
        }
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

  getRecordingCapabilities(): Promise<RecordingCapabilities> {
    return this.recordingCapabilitiesWaiter.promise;
  }

  getRecordingTarget(): Promise<RecordingTarget> {
    return this.recordingTargetWaiter.promise;
  }

  timeWarp(point: ExecutionPoint, time: number, openSource: boolean, frame?: Frame) {
    this.currentPoint = point;
    this.currentTime = time;
    this.currentPauseId = null;
    this.emit("paused", { point, time, openSource, frame });
  }

  timeWarpToPause(pause: Pause, openSource: boolean) {
    const { point, time, pauseId } = pause;
    assert(point && time, "point or time not set on pause");
    this.currentPoint = point;
    this.currentTime = time;
    this.currentPauseId = pauseId;
    this.emit("paused", { point, time, openSource });
  }

  async ensureAllSources() {
    await this.allSourcesWaiter.promise;
  }

  public markSourcesLoaded() {
    // Called by `debugger/src/client/index`, in `setupDebugger()`.
    // Sources are now fetched via `SourcesCache`.
    this.allSourcesWaiter.resolve();
  }

  // Same as evaluate, but returns the result without wrapping a ValueFront around them.
  // TODO Replace usages of evaluate with this.
  async evaluate({
    replayClient,
    pauseId,
    text,
    frameId,
    pure = false,
  }: {
    replayClient: ReplayClientInterface;
    pauseId?: PauseId;
    text: string;
    frameId?: FrameId;
    pure?: boolean;
  }) {
    if (!pauseId) {
      pauseId = await this.getCurrentPauseId(replayClient);
    }
    const abilities = await this.recordingCapabilitiesWaiter.promise;
    const { result } = frameId
      ? await client.Pause.evaluateInFrame(
          {
            frameId,
            expression: text,
            useOriginalScopes: true,
            pure: abilities.supportsPureEvaluation && pure,
          },
          this.sessionId!,
          pauseId
        )
      : await client.Pause.evaluateInGlobal(
          {
            expression: text,
            pure: abilities.supportsPureEvaluation && pure,
          },
          this.sessionId!,
          pauseId
        );
    cachePauseData(replayClient, pauseId, result.data);

    if (repaintAfterEvaluationsExperimentalFlag) {
      const { repaint } = await import("protocol/graphics");
      // Fire and forget
      repaint(true);
    }

    if (result.returned) {
      return { exception: null, returned: result.returned as unknown as Value };
    } else if (result.exception) {
      return { exception: result.exception as unknown as Value, returned: null };
    } else {
      return { exception: null, returned: null };
    }
  }

  private async _findResumeTarget(
    findTargetCommand: FindTargetCommand,
    {
      point,
      loadedRegions,
      sourceId,
      locationsToSkip,
    }: ResumeOperationParams & { point: ExecutionPoint }
  ) {
    assert(this.sessionId, "no sessionId");
    await this.ensureAllSources();

    while (true) {
      // Check already-known resume targets.
      const key = `${point}:${findTargetCommand.name}`;
      let target = this.resumeTargets.get(key);

      if (!target) {
        const epoch = this.resumeTargetEpoch;
        try {
          const resp = await findTargetCommand({ point }, this.sessionId);
          target = resp.target;
          if (epoch == this.resumeTargetEpoch) {
            this.updateMappedLocation(target.frame);
            this.resumeTargets.set(key, target);
          }
        } catch {
          return null;
        }
      }

      if (
        loadedRegions.loaded.every(
          region =>
            BigInt(target!.point) < BigInt(region.begin.point) ||
            BigInt(target!.point) > BigInt(region.end.point)
        )
      ) {
        return null;
      }

      if (locationsToSkip) {
        const location = target.frame?.find(location => location.sourceId === sourceId);
        if (location && locationsInclude(locationsToSkip, location)) {
          point = target.point;
          continue;
        }
      }

      return target;
    }
  }

  private async _resumeOperation(
    command: FindTargetCommand,
    {
      point: selectedPoint,
      sourceId: selectedSourceId,
      loadedRegions,
      locationsToSkip,
    }: ResumeOperationParams
  ) {
    this.emit("resumed");

    const point = selectedPoint || this.currentPoint;
    const resumeTarget = await this._findResumeTarget(command, {
      point,
      loadedRegions,
      sourceId: selectedSourceId,
      locationsToSkip,
    });

    if (resumeTarget) {
      const { point, time, frame } = resumeTarget!;
      this.timeWarp(point, time, !!frame);
    } else {
      this.emit("paused", {
        point: this.currentPoint,
        time: this.currentTime,
        openSource: true,
      });
    }

    return resumeTarget;
  }

  rewind(params: ResumeOperationParams) {
    return this._resumeOperation(client.Debugger.findRewindTarget, params);
  }
  resume(params: ResumeOperationParams) {
    return this._resumeOperation(client.Debugger.findResumeTarget, params);
  }
  reverseStepOver(params: ResumeOperationParams) {
    return this._resumeOperation(client.Debugger.findReverseStepOverTarget, params);
  }
  stepOver(params: ResumeOperationParams) {
    return this._resumeOperation(client.Debugger.findStepOverTarget, params);
  }
  stepIn(params: ResumeOperationParams) {
    return this._resumeOperation(client.Debugger.findStepInTarget, params);
  }
  stepOut(params: ResumeOperationParams) {
    return this._resumeOperation(client.Debugger.findStepOutTarget, params);
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
    await client.Network.findRequests({}, sessionId);
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
