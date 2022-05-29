/* Copyright 2022 Record Replay Inc. */

import sample from "lodash/sample";
import sampleSize from "lodash/sampleSize";
import random from "lodash/random";
import flattenDeep from "lodash/flattenDeep";
import flatten from "lodash/flatten";

import {
  CommandMethods,
  CommandParams,
  CommandResult,
  createPauseResult,
  ExecutionPoint,
  findStepOverTargetResult,
  Location,
  newSource,
  Object as ProtocolObject,
  PauseData,
  SameLineSourceLocations,
  TimeStampedPoint,
  ProtocolClient,
} from "@replayio/protocol";

import { addEventListener, sendMessage } from "protocol/socket";

function assert(condition: any, message = "Assertion failed!"): asserts condition {
  if (!condition) {
    console.error(message);
    throw new Error(message);
  }
}

function waitForTime(ms: number) {
  console.log(`waiting ${ms}ms`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(label: string, args = {}) {
  console.log(new Date(), label, JSON.stringify(args));
}

const lowEnd = 3;
const highEnd = 10;

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

interface PauseInfo extends TimeStampedPoint {
  pauseId: string;
}

export class Fuzzer {
  analysis: Map<string, Array<string>> = new Map();
  sessionId: string | undefined;
  client: ProtocolClient | undefined;

  constructor(client: ProtocolClient, sessionId: string) {
    this.client = client;
    this.sessionId = sessionId;
  }

  async sendCommand<M extends CommandMethods>(
    command: M,
    params: CommandParams<M>,
    sessionId?: string,
    pauseId?: string
  ): Promise<CommandResult<M>> {
    return sendMessage(command, params, sessionId, pauseId);
  }

  async fetchSources() {
    const { sessionId } = this;

    // sources are files that can have possible breakpoint locations in them
    const sources: Array<newSource> = [];
    addEventListener("Debugger.newSource", source => {
      sources.push(source);
    });
    await this.sendCommand("Debugger.findSources", {}, sessionId);
    return sources;
  }

  async getPossibleBreakpoints(source: newSource): Promise<Array<SameLineSourceLocations>> {
    const result = await this.sendCommand(
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

      addEventListener("Analysis.analysisResult", ({ results }) => {
        values.push(...results.map(r => r.value));
      });
      addEventListener("Analysis.analysisPoints", _ => {});

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
        this.sendCommand("Analysis.runAnalysis", { analysisId }, this.sessionId),
        this.sendCommand("Analysis.findAnalysisPoints", { analysisId }, this.sessionId),
      ]);

      return values;
    } catch (e) {
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
    await Promise.all([
      this.sendCommand("CSS.getComputedStyle", { node }, this.sessionId, pauseId),
      this.sendCommand("CSS.getAppliedRules", { node }, this.sessionId, pauseId),
      this.sendCommand("DOM.getEventListeners", { node }, this.sessionId, pauseId),
      this.sendCommand("DOM.getBoxModel", { node }, this.sessionId, pauseId),
      this.sendCommand("DOM.getBoundingClientRect", { node }, this.sessionId, pauseId),
    ]);
  }

  async loadBoundingClientRects(pauseId: string) {
    const result = await this.sendCommand(
      "DOM.getAllBoundingClientRects",
      {},
      this.sessionId,
      pauseId
    );

    return result.elements;
  }

  async repaintGraphics(pauseId: string) {
    return this.sendCommand("DOM.repaintGraphics", {}, this.sessionId, pauseId);
  }

  loadRandomNodes = async (pauseId: string) => {
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
  };

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
    addEventListener("Graphics.paintPoints", result => {
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

export async function replayRecording(
  client: ProtocolClient,
  recordingId: string,
  sessionId: string
) {
  const fuzzer = new Fuzzer(client, sessionId);
  let success = false;

  const sources = await fuzzer.fetchSources();
  await fuzzer.loadPaintPoints();

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
      randomTimes<ProtocolObject | undefined>(object, object => fuzzer.expandObject(object, pause))
    )
  );

  log("\n## Randomly fetch some DOM nodes", { recordingId, sessionId });
  await selectSample(pauses, pause => fuzzer.loadRandomNodes(pause.pauseId));

  success = true;

  // await fuzzer.destroy();
  return success;
}
