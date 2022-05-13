/* Copyright 2022 Record Replay Inc. */

import sample from "lodash/sample";
import sampleSize from "lodash/sampleSize";
import random from "lodash/random";
import flattenDeep from "lodash/flattenDeep";
import flatten from "lodash/flatten";

import { pingTelemetry } from "ui/utils/replay-telemetry";

import {
  CommandMethods,
  CommandParams,
  CommandResult,
  createPauseResult,
  ExecutionPoint,
  findStepOverTargetResult,
  Location,
  newSource,
  NodeBounds,
  Object as ProtocolObject,
  PauseData,
  SameLineSourceLocations,
  TimeStampedPoint,
} from "@recordreplay/protocol";

import ProtocolClient from "./utils/ProtocolClient";
import { MsPerSecond } from "./utils/utils";
import { defer, Deferred } from "./utils/promise";
import { waitForTime } from "./utils/timer";
import { assert } from "./utils/assert";

function log(label: string, args = {}) {
  console.log(new Date(), label, JSON.stringify(args));
}

function logError(label: string, error: unknown) {
  console.error(new Date(), label, error);
}

// How many snapshots to create/restore when testing.
let gNumTestSnapshots = 20;

const lowEnd = 3;
const highEnd = 10;
const serverUrl = "wss://dispatch.replay.io";

async function withTimeout<T>(name: string, cbk: () => Promise<T>) {
  return Promise.race([
    cbk(),
    waitForTime(60 * 1000).then(() => {
      throw new Error(`Method timedout ${name}`);
    }),
  ]);
}

async function selectSample<T, U>(
  items: Array<T>,
  cbk: (item: T) => Promise<U>
): Promise<Array<U>> {
  const n = random(lowEnd, highEnd);
  const sampledItems = sampleSize(items, n);
  const results = [];
  for (let i = 0; i < sampledItems.length; i++) {
    const result = await cbk(sampledItems[i]);
    results.push(result);
  }
  // const results = await Promise.all(sampledItems.map(item => cbk(item)));
  return [...results];
}

async function randomTimes<T>(item: T, cbk: (item: T) => Promise<T>): Promise<Array<T>> {
  const n = random(lowEnd, highEnd);
  const results = [item];

  for (let i = 0; i < n; i++) {
    results.push(await cbk(results[results.length - 1]));
  }

  return results;
}

function comparePoints(p1: string, p2: string) {
  const b1 = BigInt(p1);
  const b2 = BigInt(p2);
  return b1 < b2 ? -1 : b1 > b2 ? 1 : 0;
}

function findRectangle(
  pixelTest: (x: number, y: number) => boolean,
  width: number,
  height: number,
  minSize = 8
) {
  for (let x = 0; x < width; x += minSize) {
    for (let y = 0; y < width; y += minSize) {
      if (pixelTest(x, y)) {
        const rect = growRectangle(x, y);
        if (rect.right - rect.left > minSize && rect.bottom - rect.top > minSize) {
          return rect;
        }
      }
    }
  }

  function growRectangle(x: number, y: number) {
    let left = x;
    while (left > 0 && pixelTest(left - 1, y)) {
      left--;
    }
    let right = x;
    while (right < width - 1 && pixelTest(right + 1, y)) {
      right++;
    }

    const lineTest = (y: number) => {
      for (let x = left; x < right; x++) {
        if (!pixelTest(x, y)) {
          return false;
        }
      }
      return true;
    };
    let top = y;
    while (top > 0 && lineTest(top - 1)) {
      top--;
    }
    let bottom = y;
    while (bottom < height - 1 && lineTest(bottom + 1)) {
      bottom++;
    }
    return { left, right, top, bottom };
  }
}

// This is the algorithm that is also used by the node picker in devtools
function pickNode(elements: NodeBounds[], x: number, y: number) {
  for (const { node, rect, rects, clipBounds, visibility, pointerEvents } of elements) {
    if (visibility === "hidden" || pointerEvents === "none") {
      continue;
    }
    if (
      (clipBounds?.left !== undefined && x < clipBounds.left) ||
      (clipBounds?.right !== undefined && x > clipBounds.right) ||
      (clipBounds?.top !== undefined && y < clipBounds.top) ||
      (clipBounds?.bottom !== undefined && y > clipBounds.bottom)
    ) {
      continue;
    }

    for (const r of rects || [rect]) {
      const [left, top, right, bottom] = r;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return node;
      }
    }
  }
}

interface PauseInfo extends TimeStampedPoint {
  pauseId: string;
}

export class Fuzzer {
  dispatchAddress: string;
  recordingId: string;
  url: string | undefined;
  analysis: Map<string, Array<string>> = new Map();
  sessionId: string | undefined;
  client: ProtocolClient | undefined;

  constructor(dispatchAddress: string, recordingId: string, url?: string) {
    this.dispatchAddress = dispatchAddress;
    this.recordingId = recordingId;
    this.url = url;
  }

  async destroy() {
    const { client, sessionId } = this;
    if (client) {
      if (sessionId) {
        await this.sendCommand("Recording.releaseSession", { sessionId });
      }
      client.close();
    }
    log("ReplayRecording Finished");
  }

  // Creates a session and replays the recording. Returns null if there was an error
  // while replaying.
  async setup(options: ReplayOptions): Promise<string | null> {
    const { recordingId } = this;
    this.client = new ProtocolClient(this.dispatchAddress, {
      onError: e => log(`Socket error`, { recordingId, error: e }),
      onClose: (code, reason) => log(`Socket closed`, { code, reason, recordingId }),
    });

    const successWaiter = defer<boolean>();

    this.client.addEventListener("Recording.sessionError", e => {
      log(`sessionError`, { error: e, recordingId });
      successWaiter.resolve(false);
    });
    this.client.addEventListener("Recording.uploadedData", () => {
      // No-op handler so that we don't log warnings about unknown messages if the
      // recording is still in the process of uploading when this script runs.
    });

    this.client.addEventListener("Session.missingRegions", () => {});
    this.client.addEventListener("Session.unprocessedRegions", () => {});

    if (options.apiKey) {
      await this.sendCommand("Authentication.setAccessToken", {
        accessToken: options.apiKey,
      });
    }

    let experimentalSettings;

    let testSnapshotsWaiter: Deferred<void> | undefined;
    if (options.testSnapshotCallback) {
      testSnapshotsWaiter = defer();
      experimentalSettings = {
        testSnapshots: gNumTestSnapshots,

        // Ensure we get a different controller every time when testing snapshots.
        controllerKey: Math.random().toString(),
      };
      this.client.addEventListener("Session.experimentalEvent", ({ kind, data }) => {
        if (kind == "testSnapshotsResult") {
          assert(testSnapshotsWaiter);
          assert(options.testSnapshotCallback);
          const { snapshotsCreated, snapshotsRestored, crashesAfterRestore } = data;
          options.testSnapshotCallback(
            sessionId,
            snapshotsCreated,
            snapshotsRestored,
            crashesAfterRestore
          );
          testSnapshotsWaiter.resolve();
        }
      });
    }

    const result = await this.sendCommand("Recording.createSession", {
      recordingId,
      experimentalSettings,
    });

    const { sessionId } = result;
    log(`New Session`, { sessionId, recordingId });

    this.client
      .sendCommand(
        "Session.ensureProcessed",
        {
          level: options.executionIndexed ? "executionIndexed" : "basic",
        },
        sessionId
      )
      .then(() => successWaiter.resolve(true));

    const success = await successWaiter.promise;
    if (!success) {
      return null;
    }

    // Wait for snapshot testing to finish if required.
    if (testSnapshotsWaiter) {
      await testSnapshotsWaiter.promise;
    }

    this.sessionId = sessionId;
    return sessionId;
  }

  async sendCommandWithTimeout<M extends CommandMethods>(
    command: M,
    params: CommandParams<M>,
    sessionId?: string,
    pauseId?: string
  ) {
    return Promise.race([
      this.sendCommand(command, params, sessionId, pauseId),
      waitForTime(20 * 1000).then(() => {
        throw new Error(`Command timedout ${command}`);
      }),
    ]);
  }

  async sendCommand<M extends CommandMethods>(
    command: M,
    params: CommandParams<M>,
    sessionId?: string,
    pauseId?: string
  ): Promise<CommandResult<M>> {
    let result;
    try {
      const initialTime = new Date();
      assert(this.client);
      result = await this.client.sendCommand(command, params, sessionId, pauseId);
      const duration = +new Date() - +initialTime;

      log(`sendCommand ${command}`, {
        duration,
        params,
        sessionId: this.sessionId,
        pauseId,
        recordingId: this.recordingId,
      });
    } catch (e) {
      logError(`Command failed ${command}`, { error: e, recordingId: this.recordingId });
      throw new Error(`Command ${command} failed`);
    }

    return result;
  }

  pingTelemetry(event: string, tags: any = {}) {
    pingTelemetry(event, {
      recordingId: this.recordingId,
      sessionId: this.sessionId,
      ...tags,
      service_name: "stress-test",
    });
  }

  async fetchSources() {
    const { client, sessionId } = this;
    assert(client);

    // sources are files that can have possible breakpoint locations in them
    const sources: Array<newSource> = [];
    client.addEventListener("Debugger.newSource", source => {
      sources.push(source);
    });
    await client.sendCommand("Debugger.findSources", {}, sessionId);
    return sources;
  }

  async getPossibleBreakpoints(source: newSource): Promise<Array<SameLineSourceLocations>> {
    assert(this.client);
    const result = await this.client.sendCommand(
      "Debugger.getPossibleBreakpoints",
      { sourceId: source.sourceId },
      this.sessionId
    );

    return result.lineLocations;
  }

  async getLogpoints(location: Location): Promise<Array<PauseInfo>> {
    try {
      const values: Array<PauseInfo> = [];
      const initialTime = new Date();

      assert(this.client);
      assert(this.sessionId);
      this.client.addEventListener("Analysis.analysisResult", ({ results }) => {
        values.push(...results.map(r => r.value));
      });
      this.client.addEventListener("Analysis.analysisPoints", _ => {});

      const result = await this.sendCommand(
        "Analysis.createAnalysis",
        {
          mapper: `
        const { point, time, pauseId } = input;
        return [{
          key: point,
          value: { time, pauseId, point }
        }];`,
          effectful: true,
        },
        this.sessionId
      );
      const { analysisId } = result;

      this.analysis.set(analysisId, []);

      await this.sendCommand(
        "Analysis.addLocation",
        {
          location,
          analysisId,
        },
        this.sessionId
      );

      await Promise.all([
        this.sendCommandWithTimeout("Analysis.runAnalysis", { analysisId }, this.sessionId),
        this.sendCommandWithTimeout("Analysis.findAnalysisPoints", { analysisId }, this.sessionId),
      ]);
      log(`Logpoints results`, {
        duration: +new Date() - +initialTime,
        results: values.length,
        recordingId: this.recordingId,
      });

      return values;
    } catch (e) {
      log(`Analysis failed for location`, { location });
      console.error(e);
      return [];
    }
  }

  async step(fromPoint: ExecutionPoint): Promise<TimeStampedPoint> {
    const directions: CommandMethods[] = ["Debugger.findStepOverTarget"];
    const dir = sample(directions);
    assert(dir);
    const result = await this.sendCommand(dir, { point: fromPoint }, this.sessionId);
    const { point, time } = (result as findStepOverTargetResult).target;
    return { point, time };
  }

  async expandObject(object: ProtocolObject | undefined, pause: createPauseResult) {
    if (!object || !object.objectId) {
      return;
    }

    const preview = await this.sendCommand(
      "Pause.getObjectPreview",
      { object: object.objectId },
      this.sessionId,
      pause.pauseId
    );

    const newObject = sample(preview.data.objects);
    return newObject;
  }

  fetchPause(point: ExecutionPoint): Promise<createPauseResult> {
    const result = this.sendCommand("Session.createPause", { point }, this.sessionId);
    return result;
  }

  // place logpoints in random locations for a given source
  async randomLogpoints(source: newSource): Promise<Array<Array<PauseInfo>>> {
    const lineLocations = await this.getPossibleBreakpoints(source);
    return selectSample(lineLocations, async ({ line, columns }) => {
      const column = sample(columns);
      assert(typeof column === "number");
      const location = { sourceId: source.sourceId, line, column };
      const logpoints = await this.getLogpoints(location);
      return logpoints;
    });
  }

  async getEndpoint() {
    const { endpoint } = await this.sendCommand("Session.getEndpoint", {}, this.sessionId);
    return endpoint;
  }

  async getBody(pauseId: string) {
    const { document } = await this.sendCommand("DOM.getDocument", {}, this.sessionId, pauseId);
    const { result, data } = await this.sendCommand(
      "DOM.querySelector",
      { node: document, selector: "body" },
      this.sessionId,
      pauseId
    );
    return data.objects?.find(o => o.objectId === result);
  }

  async getObject(objectId: string, pauseId: string) {
    const res = await this.sendCommand(
      "Pause.getObjectPreview",
      { object: objectId },
      this.sessionId,
      pauseId
    );
    return res.data.objects?.find(o => o.objectId === objectId);
  }

  async getChildNodeIds(nodeId: string, pauseId: string) {
    const object = await this.getObject(nodeId, pauseId);
    return object?.preview?.node?.childNodes || [];
  }

  async loadStyles(nodeId: string, pauseId: string) {
    const node = nodeId;
    try {
      await Promise.all([
        this.sendCommand("CSS.getComputedStyle", { node }, this.sessionId, pauseId),
        this.sendCommand("CSS.getAppliedRules", { node }, this.sessionId, pauseId),
        this.sendCommand("DOM.getEventListeners", { node }, this.sessionId, pauseId),
        this.sendCommand("DOM.getBoxModel", { node }, this.sessionId, pauseId),
        this.sendCommand("DOM.getBoundingClientRect", { node }, this.sessionId, pauseId),
      ]);
    } catch (e: any) {
      log(`Load styles for node ${nodeId} failed`, e.message);
    }
  }

  async loadBoundingClientRects(pauseId: string) {
    try {
      const result = await this.sendCommand(
        "DOM.getAllBoundingClientRects",
        {},
        this.sessionId,
        pauseId
      );
      log(`getAllBoundingClientRects results`, {
        elementCount: result.elements.length,
        pauseId: pauseId,
        sessionId: this.sessionId,
      });
      return result.elements;
    } catch (e: any) {
      log(`getAllBoundingClientRects failed`, e.message);
    }
  }

  async repaintGraphics(pauseId: string) {
    try {
      const result = await this.sendCommand("DOM.repaintGraphics", {}, this.sessionId, pauseId);
      log(`repaintGraphics result`, { keys: Object.keys(result) });
      return result;
    } catch (e: any) {
      log(`repaintGraphics failed`, e.message);
    }
  }

  loadRandomNodes = (pauseId: string) =>
    withTimeout(`loadRandomNodes for ${pauseId}`, async () => {
      const body = await this.getBody(pauseId);
      let childNodeIds = body?.preview?.node?.childNodes || [];
      // we descend 10 levels into the document and on each level we load styling information
      // of all children of the nodes selected on the previous level and randomly select
      // some children for the next level
      for (let i = 0; i < highEnd; i++) {
        // Only load styles for one node at a time, which is what will happen when people
        // are using the devtools.
        for (const nodeId of childNodeIds) {
          await this.loadStyles(nodeId, pauseId);
        }
        childNodeIds = flatten(
          await selectSample(childNodeIds, nodeId => this.getChildNodeIds(nodeId, pauseId))
        );
      }
    });

  loadFrames(pauseId: string) {
    return this.sendCommand("Pause.getAllFrames", {}, this.sessionId, pauseId);
  }

  loadFrameSteps(pauseId: string, frameId: string) {
    return this.sendCommand("Pause.getFrameSteps", { frameId }, this.sessionId, pauseId);
  }

  loadScope(pauseId: string, scopeId: string) {
    return this.sendCommand("Pause.getScope", { scope: scopeId }, this.sessionId, pauseId);
  }

  evaluateInFrame(pauseId: string, frameId: string, expression: string) {
    return this.sendCommand(
      "Pause.evaluateInFrame",
      { frameId, expression },
      this.sessionId,
      pauseId
    );
  }

  evaluateInGlobal(pauseId: string, expression: string) {
    return this.sendCommand("Pause.evaluateInGlobal", { expression }, this.sessionId, pauseId);
  }

  async loadPaintPoints() {
    const promise = this.sendCommand("Graphics.findPaints", {}, this.sessionId);
    const paintPoints: string[] = [];
    assert(this.client);
    this.client.addEventListener("Graphics.paintPoints", result => {
      paintPoints.push(...result.paints.map(paint => paint.point));
    });
    await promise;
    paintPoints.sort(comparePoints);
    return paintPoints;
  }

  loadGraphics(point: string) {
    return this.sendCommand(
      "Graphics.getPaintContents",
      { mimeType: "image/jpeg", point },
      this.sessionId
    );
  }

  async getWindowSize(pauseId: string) {
    const width = (await this.evaluateInGlobal(pauseId, "innerWidth")).result?.returned?.value;
    const height = (await this.evaluateInGlobal(pauseId, "innerHeight")).result?.returned?.value;
    return { width, height };
  }

  findClassName(objectId: string, data: PauseData) {
    for (const objPreview of data.objects || []) {
      if (objPreview.objectId === objectId) {
        return objPreview.className;
      }
    }
  }
}

export async function replayRecording(recordingId: string, url?: string) {
  log("Replay recording", recordingId);
  let sessionId: string | null = null;
  const fuzzer = new Fuzzer(serverUrl, recordingId, url);
  const startTime = new Date();

  let success = false;
  try {
    sessionId = await fuzzer.setup();
    if (!sessionId) {
      console.log(`>> no session created`);
      await fuzzer.destroy();
      return false;
    }

    const sources = await fuzzer.fetchSources();
    const paintPoints = await fuzzer.loadPaintPoints();

    log("\n## Randomly add logpoints in various files", { recordingId, sessionId });
    const pauseInfos: Array<PauseInfo> = flattenDeep(
      await selectSample(sources, async source => fuzzer.randomLogpoints(source))
    );

    log("\n## Randomly step through various points", { recordingId, sessionId });
    const stepPoints = flattenDeep(
      await selectSample(pauseInfos, info =>
        randomTimes<TimeStampedPoint>(info, item => fuzzer.step(item.point))
      )
    );

    const endPoint = await fuzzer.getEndpoint();
    const points = [...pauseInfos, ...stepPoints, endPoint];

    log("\n## Randomly fetch frames for various pauses", { recordingId, sessionId });
    await selectSample(pauseInfos, info => fuzzer.loadFrames(info.pauseId));

    log("\n## Randomly fetch pauses for various points", { recordingId, sessionId });
    const pauses = await selectSample(points, async ({ point, time }) => {
      const pause = await fuzzer.fetchPause(point);
      return { point, time, ...pause };
    });

    log("\n## Randomly fetch frame steps for various pauses", {
      recordingId,
      sessionId,
    });
    await selectSample(pauses, pause =>
      selectSample(pause.data.frames!, frame => fuzzer.loadFrameSteps(pause.pauseId, frame.frameId))
    );

    log("\n## Randomly evaluate some global expressions in various pauses");
    await selectSample(pauses, async pause => {
      await fuzzer.evaluateInGlobal(pause.pauseId, "location.href");
      await fuzzer.evaluateInGlobal(pause.pauseId, 'document.querySelectorAll("script")');
    });

    log("\n## Randomly fetch scopes and evaluate variables in them for various pauses", {
      recordingId,
      sessionId,
    });
    await selectSample(pauses, pause =>
      selectSample(pause.data.frames!, frame =>
        selectSample(frame.scopeChain, async scopeId => {
          const scope = await fuzzer.loadScope(pause.pauseId, scopeId);
          const bindings = scope.data.scopes?.[0].bindings;
          if (bindings) {
            selectSample(bindings, ({ name }) =>
              fuzzer.evaluateInFrame(pause.pauseId, frame.frameId, name)
            );
          }
        })
      )
    );

    log("\n## Randomly expands objects for various pauses", { recordingId, sessionId });
    await selectSample(pauses, pause =>
      selectSample(pause.data.objects!, object =>
        randomTimes<ProtocolObject | undefined>(object, object =>
          fuzzer.expandObject(object, pause)
        )
      )
    );

    log("\n## Randomly fetch some DOM nodes", { recordingId, sessionId });
    await selectSample(pauses, pause => fuzzer.loadRandomNodes(pause.pauseId));

    log("\n## Randomly repaint and look for black rectangles", {
      recordingId,
      sessionId,
    });

    log(`\n## Finished Replaying`, {
      recordingId,
      sessionId,
      duration: +new Date() - +startTime,
    });
    success = true;
  } catch (e) {
    logError("Encountered error interacting with recording", {
      error: e,
      recordingId,
      sessionId,
    });
  }

  await fuzzer.destroy();
  return success;
}
