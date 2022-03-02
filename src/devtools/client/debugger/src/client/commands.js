/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { prepareSourcePayload, createFrame } from "./create";
import { clientEvents } from "./events";

const { ThreadFront, createPrimitiveValueFront } = require("protocol/thread");
const { fetchEventTypePoints } = require("protocol/logpoint");
const {
  setLogpoint,
  setLogpointByURL,
  newLogGroupId,
  setEventLogpoints,
  setExceptionLogpoint,
  removeLogpoint,
} = require("protocol/logpoint");

let currentThreadFront;
let currentTarget;
let devToolsClient;
let sourceActors;
let breakpoints;

function setupCommands() {
  sourceActors = {};
  breakpoints = {};
}

function releaseActor(actor) {
  // Object fronts are always thread scoped in the replay viewer.
  return;
}

function resume(point, loadedRegions) {
  return ThreadFront.resume(point, loadedRegions);
}

function stepIn(point, loadedRegions) {
  return ThreadFront.stepIn(point, loadedRegions);
}

function stepOver(point, loadedRegions) {
  return ThreadFront.stepOver(point, loadedRegions);
}

function stepOut(point, loadedRegions) {
  return ThreadFront.stepOut(point, loadedRegions);
}

function rewind(point, loadedRegions) {
  return ThreadFront.rewind(point, loadedRegions);
}

function reverseStepOver(point, loadedRegions) {
  return ThreadFront.reverseStepOver(point, loadedRegions);
}

async function sourceContents({ actor }) {
  const threadFront = ThreadFront;
  const { contents, contentType } = await threadFront.getSourceContents(actor);
  return { source: contents, contentType };
}

function setXHRBreakpoint(path, method) {
  return currentThreadFront.setXHRBreakpoint(path, method);
}

function removeXHRBreakpoint(path, method) {
  return currentThreadFront.removeXHRBreakpoint(path, method);
}

function addWatchpoint(object, property, label, watchpointType) {}

async function removeWatchpoint(object, property) {}

// Get the string key to use for a breakpoint location.
// See also duplicate code in breakpoint-actor-map.js :(
function locationKey(location) {
  const { sourceUrl, line, column } = location;
  const sourceId = location.sourceId || "";
  // $FlowIgnore
  return `${sourceUrl}:${sourceId}:${line}:${column}`;
}

function maybeGenerateLogGroupId(options) {
  if (options.logValue) {
    return { ...options, logGroupId: newLogGroupId() };
  }
  return options;
}

async function maybeClearLogpoint(location) {
  const bp = breakpoints[locationKey(location)];
  if (bp && bp.options.logGroupId) {
    removeLogpoint(bp.options.logGroupId);
  }
}

function hasBreakpoint(location) {
  return !!breakpoints[locationKey(location)];
}

function setBreakpoint(location, options) {
  maybeClearLogpoint(location);
  options = maybeGenerateLogGroupId(options);
  breakpoints[locationKey(location)] = { location, options };

  const { condition, logValue, logGroupId, shouldPause } = options;
  const { line, column, sourceUrl, sourceId } = location;
  const promises = [];

  if (sourceId) {
    if (shouldPause) {
      promises.push(ThreadFront.setBreakpoint(sourceId, line, column, condition));
    }
    if (logValue) {
      promises.push(setLogpoint(logGroupId, { sourceId, line, column }, logValue, condition));
    }
  } else {
    if (shouldPause) {
      promises.push(ThreadFront.setBreakpointByURL(sourceUrl, line, column, condition));
    }
    if (logValue) {
      promises.push(setLogpointByURL(logGroupId, sourceUrl, line, column, logValue, condition));
    }
  }

  return Promise.all(promises);
}

// jvv
function removeBreakpoint(location) {
  maybeClearLogpoint(location);
  delete breakpoints[locationKey(location)];

  const { line, column, sourceUrl, sourceId } = location;
  if (sourceId) {
    return ThreadFront.removeBreakpoint(sourceId, line, column);
  }
  return ThreadFront.removeBreakpointByURL(sourceUrl, line, column);
}

function runAnalysis(location, options) {
  options = maybeGenerateLogGroupId(options);
  const { condition, logValue, logGroupId } = options;
  const { line, column, sourceUrl, sourceId } = location;
  const showInConsole = false;

  if (sourceId) {
    setLogpoint(logGroupId, { sourceId, line, column }, logValue, condition, showInConsole);
  } else {
    setLogpointByURL(logGroupId, sourceUrl, line, column, logValue, condition, showInConsole);
  }
}

async function evaluateExpressions(sources, options) {
  return Promise.all(sources.map(source => evaluate(source, options)));
}

async function evaluate(source, { asyncIndex, frameId } = {}) {
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

async function autocomplete(input, cursor, frameId) {
  if (!currentTarget || !input) {
    return {};
  }
  const consoleFront = await currentTarget.getFront("console");
  if (!consoleFront) {
    return {};
  }

  return new Promise(resolve => {
    consoleFront.autocomplete(input, cursor, result => resolve(result), frameId);
  });
}

function navigate(url) {
  return currentTarget.navigateTo({ url });
}

function reload() {
  return currentTarget.reload();
}

function getProperties(grip) {
  const objClient = ThreadFront.pauseGrip(grip);

  return objClient.getPrototypeAndProperties().then(resp => {
    const { ownProperties, safeGetterValues } = resp;
    for (const name in safeGetterValues) {
      const { enumerable, writable, getterValue } = safeGetterValues[name];
      ownProperties[name] = { enumerable, writable, value: getterValue };
    }
    return resp;
  });
}

async function getFrames() {
  const frames = await ThreadFront.getFrames();
  return Promise.all(frames.map((frame, i) => createFrame(frame, i)));
}

async function loadAsyncParentFrames(asyncIndex) {
  const frames = await ThreadFront.loadAsyncParentFrames();
  return Promise.all(frames.map((frame, i) => createFrame(frame, i, asyncIndex)));
}

function convertScope(protocolScope) {
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

async function getFrameScopes(frame) {
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

async function blackBox(sourceActor, isBlackBoxed, range) {
  const begin = range ? range.start : undefined;
  const end = range ? range.end : undefined;
  if (isBlackBoxed) {
    await ThreadFront.unblackbox(sourceActor.actor, begin, end);
  } else {
    await ThreadFront.blackbox(sourceActor.actor, begin, end);
  }
}

function interrupt(thread) {
  return ThreadFront.interrupt();
}

function setEventListenerBreakpoints(ids) {
  setEventLogpoints(ids);
}

let gExceptionLogpointGroupId;

function logExceptions(shouldLog) {
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

function pauseGrip(func) {
  return ThreadFront.pauseGrip(func);
}

function registerSourceActor(sourceActorId, sourceId, url) {
  sourceActors[sourceActorId] = sourceId;
}

async function getSources(client) {
  const { sources } = await client.getSources();

  return sources.map(source => prepareSourcePayload(source));
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
  const pausedPacket = ThreadFront.getLastPausePacket();
  if (pausedPacket) {
    clientEvents.paused(ThreadFront, pausedPacket);
  }
}

function getSourceForActor(actor) {
  if (!sourceActors[actor]) {
    throw new Error(`Unknown source actor: ${actor}`);
  }
  return sourceActors[actor];
}

function getMainThread() {
  return currentThreadFront.actor;
}

async function getSourceActorBreakpointPositions({ actor }, range) {
  const linePositions = await ThreadFront.getBreakpointPositionsCompressed(actor, range);
  const rv = {};
  linePositions.forEach(({ line, columns }) => (rv[line] = columns));
  return rv;
}

async function getSourceActorBreakableLines({ actor }) {
  const positions = await ThreadFront.getBreakpointPositionsCompressed(actor);
  return positions.map(({ line }) => line);
}

function getFrontByID(actorID) {
  return devToolsClient.getFrontByID(actorID);
}

function fetchAncestorFramePositions(asyncIndex, frameId) {
  return ThreadFront.getFrameSteps(asyncIndex, frameId);
}

function pickExecutionPoints(count, options) {
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
  getSourceActorBreakpointPositions,
  getSourceActorBreakableLines,
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
  getMainThread,
  fetchEventTypePoints,
  setEventListenerBreakpoints,
  getFrontByID,
  fetchAncestorFramePositions,
  pickExecutionPoints,
};

export { setupCommands, clientCommands };
