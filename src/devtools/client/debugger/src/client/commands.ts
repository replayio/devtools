/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import {
  ScopeType,
  SourceLocation as ProtocolSourceLocation,
  loadedRegions,
} from "@replayio/protocol";
import {
  fetchEventTypePoints,
  setLogpoint,
  setLogpointByURL,
  newLogGroupId,
  setEventLogpoints,
  setExceptionLogpoint,
  removeLogpoint,
} from "ui/actions/logpoint";
import { ThreadFront, createPrimitiveValueFront, ValueFront } from "protocol/thread";
import { WiredNamedValue } from "protocol/thread/pause";

import { SelectedFrame } from "../reducers/pause";
import type { SourceActor } from "../reducers/source-actors";
import type { BreakpointOptions, SourceLocation } from "../reducers/types";

import { createFrame, makeSourceId } from "./create";

export type InitialBreakpointOptions = Pick<
  BreakpointOptions,
  "condition" | "shouldPause" | "logValue"
>;
type FinalBreakpointOptions = Pick<
  BreakpointOptions,
  "condition" | "shouldPause" | "logValue" | "logGroupId"
>;

interface BreakpointDetails {
  location: SourceLocation;
  options: FinalBreakpointOptions;
}

let currentThreadFront: any;
let currentTarget: any;
let devToolsClient: any;
let sourceActors: Record<string, string> = {};
let breakpoints: Record<string, BreakpointDetails> = {};

function setupCommands() {
  sourceActors = {};
  breakpoints = {};
}

function releaseActor() {
  // Object fronts are always thread scoped in the replay viewer.
  return;
}

function resume(point: string, loadedRegions: loadedRegions) {
  return ThreadFront.resume(point, loadedRegions);
}

function stepIn(point: string, loadedRegions: loadedRegions) {
  return ThreadFront.stepIn(point, loadedRegions);
}

function stepOver(point: string, loadedRegions: loadedRegions) {
  return ThreadFront.stepOver(point, loadedRegions);
}

function stepOut(point: string, loadedRegions: loadedRegions) {
  return ThreadFront.stepOut(point, loadedRegions);
}

function rewind(point: string, loadedRegions: loadedRegions) {
  return ThreadFront.rewind(point, loadedRegions);
}

function reverseStepOver(point: string, loadedRegions: loadedRegions) {
  return ThreadFront.reverseStepOver(point, loadedRegions);
}

async function sourceContents({ actor }: { actor: string }) {
  const threadFront = ThreadFront;
  const { contents, contentType } = await threadFront.getSourceContents(actor);
  return { source: contents, contentType };
}

function setXHRBreakpoint(path: any, method: any) {
  return currentThreadFront.setXHRBreakpoint(path, method);
}

function removeXHRBreakpoint(path: any, method: any) {
  return currentThreadFront.removeXHRBreakpoint(path, method);
}

function addWatchpoint(object: any, property: any, label: any, watchpointType: any) {}

async function removeWatchpoint(object: any, property: any) {}

// Get the string key to use for a breakpoint location.
// See also duplicate code in breakpoint-actor-map.js :(
function locationKey(location: SourceLocation) {
  const { sourceUrl, line, column } = location;
  const sourceId = location.sourceId || "";
  // $FlowIgnore
  return `${sourceUrl}:${sourceId}:${line}:${column}`;
}

function maybeGenerateLogGroupId(options: InitialBreakpointOptions): FinalBreakpointOptions {
  if (options.logValue) {
    return { ...options, logGroupId: newLogGroupId() };
  }
  return options;
}

async function maybeClearLogpoint(location: SourceLocation) {
  const bp = breakpoints[locationKey(location)];
  if (bp && bp.options.logGroupId) {
    removeLogpoint(bp.options.logGroupId);
  }
}

function hasBreakpoint(location: SourceLocation) {
  return !!breakpoints[locationKey(location)];
}

function setBreakpoint(location: SourceLocation, options: InitialBreakpointOptions) {
  maybeClearLogpoint(location);
  const finalOptions = maybeGenerateLogGroupId(options);
  breakpoints[locationKey(location)] = { location, options: finalOptions };

  const { condition, logValue, logGroupId, shouldPause } = finalOptions;
  const { line, column, sourceUrl, sourceId } = location;
  const promises = [];

  if (sourceId) {
    if (shouldPause) {
      promises.push(ThreadFront.setBreakpoint(sourceId, line, column!, condition!));
    }
    if (logValue) {
      promises.push(
        setLogpoint(logGroupId!, { sourceId, line, column: column! }, logValue, condition!)
      );
    }
  } else {
    if (shouldPause) {
      promises.push(ThreadFront.setBreakpointByURL(sourceUrl!, line, column!, condition!));
    }
    if (logValue) {
      promises.push(setLogpointByURL(logGroupId!, sourceUrl!, line, column!, logValue, condition!));
    }
  }

  return Promise.all(promises);
}

function removeBreakpoint(location: SourceLocation) {
  maybeClearLogpoint(location);
  delete breakpoints[locationKey(location)];

  const { line, column, sourceUrl, sourceId } = location;
  if (sourceId) {
    return ThreadFront.removeBreakpoint(sourceId, line, column!);
  }
  return ThreadFront.removeBreakpointByURL(sourceUrl!, line, column!);
}

function runAnalysis(location: SourceLocation, options: InitialBreakpointOptions) {
  const finalOptions = maybeGenerateLogGroupId(options);
  const { condition, logValue, logGroupId } = finalOptions;
  const { line, column, sourceUrl, sourceId } = location;

  if (sourceId) {
    setLogpoint(logGroupId!, { sourceId, line, column: column! }, logValue!, condition!);
  } else {
    setLogpointByURL(logGroupId!, sourceUrl!, line, column!, logValue!, condition!);
  }
}

export interface EvaluateOptions {
  asyncIndex?: number;
  frameId?: string;
}

async function evaluateExpressions(sources: string[], options: EvaluateOptions) {
  return Promise.all(sources.map(source => evaluate(source, options)));
}

async function evaluate(source: string, { asyncIndex, frameId }: EvaluateOptions = {}) {
  const { returned, exception, failed } = await ThreadFront.evaluate({
    asyncIndex,
    frameId,
    text: source,
  });
  if (failed) {
    return { exception: createPrimitiveValueFront("Evaluation failed") };
  }
  if (returned) {
    return { result: returned };
  }
  return { exception };
}

async function autocomplete(input: any, cursor: any, frameId: any) {
  if (!currentTarget || !input) {
    return {};
  }
  const consoleFront = await currentTarget.getFront("console");
  if (!consoleFront) {
    return {};
  }

  return new Promise(resolve => {
    consoleFront.autocomplete(input, cursor, (result: any) => resolve(result), frameId);
  });
}

function navigate(url: string) {
  return currentTarget.navigateTo({ url });
}

function reload() {
  return currentTarget.reload();
}

function getProperties(grip: any) {
  // @ts-expect-error This function doesn't appear to exist
  const objClient = ThreadFront.pauseGrip(grip);

  return objClient.getPrototypeAndProperties().then((resp: any) => {
    const { ownProperties, safeGetterValues } = resp;
    for (const name in safeGetterValues) {
      const { enumerable, writable, getterValue } = safeGetterValues[name];
      ownProperties[name] = { enumerable, writable, value: getterValue };
    }
    return resp;
  });
}

async function getFrames() {
  const frames = (await ThreadFront.getFrames()) ?? [];
  return Promise.all(frames.map((frame, i) => createFrame(frame, i)));
}

async function loadAsyncParentFrames(asyncIndex?: number) {
  const frames = await ThreadFront.loadAsyncParentFrames();
  return Promise.all(frames.map((frame, i) => createFrame(frame, i, asyncIndex)));
}

// Isn't this a lovely type lookup?
type ProtocolScope = Awaited<ReturnType<typeof ThreadFront["getScopes"]>>["scopes"][number];

interface ConvertedScope {
  actor: string;
  parent: ConvertedScope | null;
  bindings: WiredNamedValue[] | undefined;
  object: ValueFront | undefined;
  functionName: string | undefined;
  type: ScopeType;
  scopeKind: string;
}

function convertScope(protocolScope: ProtocolScope): ConvertedScope {
  const { scopeId, type, functionLexical, object, functionName, bindings } = protocolScope;

  return {
    actor: scopeId,
    parent: null,
    bindings,
    object,
    functionName,
    type,
    scopeKind: functionLexical ? "function lexical" : "",
  };
}

async function getFrameScopes(frame: SelectedFrame) {
  const { scopes, originalScopesUnavailable } = await ThreadFront.getScopes(
    frame.asyncIndex,
    frame.protocolId
  );
  const converted = scopes.map(convertScope);
  for (let i = 0; i + 1 < converted.length; i++) {
    converted[i].parent = converted[i + 1];
  }
  return { scopes: converted[0], originalScopesUnavailable };
}

export interface SourceRange {
  start: ProtocolSourceLocation;
  end: ProtocolSourceLocation;
}

async function blackBox(
  sourceActor: SourceActor,
  isBlackBoxed: boolean,
  range?: Partial<SourceRange>
) {
  // TODO Re-enable blackboxing
  /*
  const begin = range ? range.start : undefined;
  const end = range ? range.end : undefined;
  if (isBlackBoxed) {
    await ThreadFront.unblackbox(sourceActor.actor, begin, end);
  } else {
    await ThreadFront.blackbox(sourceActor.actor, begin, end);
  }
  */
}

function interrupt(thread: any) {
  // @ts-expect-error this function doesn't appear to exist
  return ThreadFront.interrupt();
}
function setEventListenerBreakpoints(ids: string[]) {
  setEventLogpoints(ids);
}

let gExceptionLogpointGroupId: string | null;

function logExceptions(shouldLog: boolean) {
  if (gExceptionLogpointGroupId) {
    removeLogpoint(gExceptionLogpointGroupId);
  }
  if (shouldLog) {
    gExceptionLogpointGroupId = newLogGroupId();
    setExceptionLogpoint(gExceptionLogpointGroupId);
  } else {
    gExceptionLogpointGroupId = null;
  }
}

function pauseGrip(func: Function) {
  // @ts-expect-error this function doesn't appear to exist
  return ThreadFront.pauseGrip(func);
}
function registerSourceActor(sourceActorId: string, sourceId: string) {
  sourceActors[sourceActorId] = sourceId;
}

export function prepareSourcePayload(source: {
  actor: string;
  url?: string;
  sourceMapURL?: string;
}) {
  clientCommands.registerSourceActor(source.actor, makeSourceId(source, false));
  return { thread: ThreadFront.actor, source };
}

async function getSources(client: any) {
  const { sources } = await client.getSources();

  return sources.map((source: any) => prepareSourcePayload(source));
}

// Fetch the sources for all the targets
async function fetchSources() {
  let sources = await getSources(ThreadFront);

  return sources;
}

// Check if any of the targets were paused before we opened
// the debugger. If one is paused. Fake a `pause` RDP event
// by directly calling the client event listener.
async function checkIfAlreadyPaused() {
  // @ts-expect-error this function has got to actually be dead
  const pausedPacket = ThreadFront.getLastPausePacket();
  if (pausedPacket) {
    // @ts-expect-error ditto
    clientEvents.paused(ThreadFront, pausedPacket);
  }
}

function getSourceForActor(actor: string) {
  if (!sourceActors[actor]) {
    throw new Error(`Unknown source actor: ${actor}`);
  }
  return sourceActors[actor];
}

function getFrontByID(actorID: string) {
  return devToolsClient.getFrontByID(actorID);
}

function fetchAncestorFramePositions(asyncIndex: number, frameId: string) {
  return ThreadFront.getFrameSteps(asyncIndex, frameId);
}

function pickExecutionPoints(count: any, options: any) {
  return currentThreadFront.pickExecutionPoints(count, options);
}

const clientCommands = {
  autocomplete,
  blackBox,
  releaseActor,
  interrupt,
  pauseGrip,
  resume,
  stepIn,
  stepOut,
  stepOver,
  rewind,
  reverseStepOver,
  sourceContents,
  getSourceForActor,
  hasBreakpoint,
  setBreakpoint,
  setXHRBreakpoint,
  removeXHRBreakpoint,
  addWatchpoint,
  removeWatchpoint,
  removeBreakpoint,
  runAnalysis,
  evaluate,
  evaluateExpressions,
  navigate,
  reload,
  getProperties,
  getFrameScopes,
  getFrames,
  loadAsyncParentFrames,
  logExceptions,
  fetchSources,
  checkIfAlreadyPaused,
  registerSourceActor,
  fetchEventTypePoints,
  setEventListenerBreakpoints,
  getFrontByID,
  fetchAncestorFramePositions,
  pickExecutionPoints,
};

export { setupCommands, clientCommands };
