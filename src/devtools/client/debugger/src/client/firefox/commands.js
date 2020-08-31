/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// 

import { prepareSourcePayload, createThread, createFrame } from "./create";
import { updateTargets } from "./targets";
import { clientEvents } from "./events";

import Reps from "devtools-reps";



const { ThreadFront, createPrimitiveValueFront } = require("protocol/thread");
const {
  setLogpoint,
  setLogpointByURL,
  setEventLogpoint,
  setExceptionLogpoint,
  removeLogpoint,
} = require("protocol/logpoint");
const { assert } = require("protocol/utils");

let targets;
let currentThreadFront;
let currentTarget;
let devToolsClient;
let sourceActors;
let breakpoints;
let eventBreakpoints;


function setupCommands(dependencies) {
  devToolsClient = dependencies.devToolsClient;
  targets = {};
  sourceActors = {};
  breakpoints = {};
}

function lookupThreadFront(thread) {
  // There is only a single thread possible currently.
  return ThreadFront;
}

function createObjectFront(grip) {
  if (!grip.actor) {
    throw new Error("Actor is missing");
  }

  return devToolsClient.createObjectFront(grip, currentThreadFront);
}

async function loadObjectProperties(root) {
  const utils = Reps.objectInspector.utils;
  const properties = await utils.loadProperties.loadItemProperties(root, devToolsClient);
  return utils.node.getChildren({
    item: root,
    loadedProperties: new Map([[root.path, properties]]),
  });
}

function releaseActor(actor) {
  // Object fronts are always thread scoped in the replay viewer.
  return;

  /*
  if (!actor) {
    return;
  }
  const objFront = devToolsClient.getFrontByID(actor);

  if (objFront) {
    return objFront.release().catch(() => {});
  }
  */
}

function sendPacket(packet) {
  return devToolsClient.request(packet);
}

// Get a copy of the current targets.
function getTargetsMap() {
  return Object.assign({}, targets);
}

function listThreadFronts() {
  const targetList = (Object.values(getTargetsMap()));
  return targetList.map(target => target.threadFront).filter(t => !!t);
}

function forEachThread(iteratee) {
  return iteratee(ThreadFront);
}

function resume(thread, point) {
  return lookupThreadFront(thread).resume(point);
}

function stepIn(thread, point) {
  return lookupThreadFront(thread).stepIn(point);
}

function stepOver(thread, point) {
  return lookupThreadFront(thread).stepOver(point);
}

function stepOut(thread, point) {
  return lookupThreadFront(thread).stepOut(point);
}

function rewind(thread, point) {
  return lookupThreadFront(thread).rewind(point);
}

function reverseStepOver(thread, point) {
  return lookupThreadFront(thread).reverseStepOver(point);
}

function breakOnNext(thread) {
  return lookupThreadFront(thread).breakOnNext();
}

async function sourceContents({
  actor,
  thread,
}) {
  const threadFront = lookupThreadFront(thread);
  const { scriptSource, contentType } = await threadFront.getScriptSource(actor);
  return { source: scriptSource, contentType };
}

function setXHRBreakpoint(path, method) {
  return currentThreadFront.setXHRBreakpoint(path, method);
}

function removeXHRBreakpoint(path, method) {
  return currentThreadFront.removeXHRBreakpoint(path, method);
}

function addWatchpoint(object, property, label, watchpointType) {
  if (currentTarget.traits.watchpoints) {
    const objectFront = createObjectFront(object);
    return objectFront.addWatchpoint(property, label, watchpointType);
  }
}

async function removeWatchpoint(object, property) {
  if (currentTarget.traits.watchpoints) {
    const objectFront = createObjectFront(object);
    await objectFront.removeWatchpoint(property);
  }
}

// Get the string key to use for a breakpoint location.
// See also duplicate code in breakpoint-actor-map.js :(
function locationKey(location) {
  const { sourceUrl, line, column } = location;
  const sourceId = location.sourceId || "";
  // $FlowIgnore
  return `${sourceUrl}:${sourceId}:${line}:${column}`;
}

function newLogGroupId() {
  return `logGroup-${Math.random()}`;
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

  const { condition, logValue, logGroupId } = options;
  const { line, column, sourceUrl, sourceId } = location;
  const promises = [];
  if (sourceId) {
    promises.push(
      ThreadFront.setBreakpoint(sourceId, line, column, condition),
      setLogpoint(logGroupId, sourceId, line, column, logValue, condition)
    );
  } else {
    promises.push(
      ThreadFront.setBreakpointByURL(sourceUrl, line, column, condition),
      setLogpointByURL(logGroupId, sourceUrl, line, column, logValue, condition)
    );
  }
  return Promise.all(promises);
}

function removeBreakpoint(location) {
  maybeClearLogpoint((location));
  delete breakpoints[locationKey((location))];

  const { line, column, sourceUrl, sourceId } = location;
  if (sourceId) {
    return ThreadFront.removeBreakpoint(sourceId, line, column);
  }
  return ThreadFront.removeBreakpointByURL(sourceUrl, line, column);
}

async function evaluateExpressions(scripts, options) {
  return Promise.all(scripts.map(script => evaluate(script, options)));
}


async function evaluate(
  script,
  { thread, asyncIndex, frameId } = {}
) {
  const threadFront = lookupThreadFront(thread);
  const { returned, exception, failed } = await threadFront.evaluate(asyncIndex, frameId, script);
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

function getProperties(thread, grip) {
  const objClient = lookupThreadFront(thread).pauseGrip(grip);

  return objClient.getPrototypeAndProperties().then(resp => {
    const { ownProperties, safeGetterValues } = resp;
    for (const name in safeGetterValues) {
      const { enumerable, writable, getterValue } = safeGetterValues[name];
      ownProperties[name] = { enumerable, writable, value: getterValue };
    }
    return resp;
  });
}

async function getFrames(thread) {
  const frames = await lookupThreadFront(thread).getFrames();
  return Promise.all(
    frames.map((frame, i) => createFrame(thread, frame, i))
  );
}

async function loadAsyncParentFrames(thread, asyncIndex) {
  const frames = await lookupThreadFront(thread).loadAsyncParentFrames();
  return Promise.all(frames.map((frame, i) => createFrame(thread, frame, i, asyncIndex)));
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
  const threadFront = lookupThreadFront(frame.thread);
  const scopes = await threadFront.getScopes(frame.asyncIndex, frame.protocolId);
  const converted = scopes.map(convertScope);
  for (let i = 0; i + 1 < converted.length; i++) {
    converted[i].parent = converted[i + 1];
  }
  return converted[0];
}

async function blackBox(
  sourceActor,
  isBlackBoxed,
  range
) {
  const begin = range ? range.start : undefined;
  const end = range ? range.end : undefined;
  if (isBlackBoxed) {
    await ThreadFront.unblackbox(sourceActor.actor, begin, end);
  } else {
    await ThreadFront.blackbox(sourceActor.actor, begin, end);
  }
}

function setSkipPausing(shouldSkip) {
  return forEachThread(thread => thread.setSkipPausing(shouldSkip));
}

function interrupt(thread) {
  return lookupThreadFront(thread).interrupt();
}

let gEventLogpointGroupId;

function setEventListenerBreakpoints(ids) {
  if (gEventLogpointGroupId) {
    removeLogpoint(gEventLogpointGroupId);
  }
  if (ids.length) {
    gEventLogpointGroupId = newLogGroupId();
    setEventLogpoint(gEventLogpointGroupId, ids);
  } else {
    gEventLogpointGroupId = null;
  }
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

function pauseGrip(thread, func) {
  return lookupThreadFront(thread).pauseGrip(func);
}

function registerSourceActor(sourceActorId, sourceId, url) {
  sourceActors[sourceActorId] = sourceId;
}

async function getSources(client) {
  const { sources } = await client.getSources();

  return sources.map(source => prepareSourcePayload(client, source));
}

function getAllThreadFronts() {
  const fronts = [currentThreadFront];
  for (const { threadFront } of (Object.values(targets))) {
    fronts.push(threadFront);
  }
  return fronts;
}

// Fetch the sources for all the targets
async function fetchSources() {
  let sources = [];
  for (const threadFront of getAllThreadFronts()) {
    sources = sources.concat(await getSources(threadFront));
  }
  return sources;
}

async function fetchThreadSources(thread) {
  return getSources(lookupThreadFront(thread));
}

// Check if any of the targets were paused before we opened
// the debugger. If one is paused. Fake a `pause` RDP event
// by directly calling the client event listener.
async function checkIfAlreadyPaused() {
  for (const threadFront of getAllThreadFronts()) {
    const pausedPacket = threadFront.getLastPausePacket();
    if (pausedPacket) {
      clientEvents.paused(threadFront, pausedPacket);
    }
  }
}

function getSourceForActor(actor) {
  if (!sourceActors[actor]) {
    throw new Error(`Unknown source actor: ${actor}`);
  }
  return sourceActors[actor];
}

async function fetchThreads() {
  const options = {
    breakpoints,
    eventBreakpoints,
    observeAsmJS: true,
  };

  await updateTargets({
    currentTarget,
    devToolsClient,
    targets,
    options,
  });

  // eslint-disable-next-line
  return (Object.entries(targets).map)(([actor, target]) =>
    createThread((actor), (target))
  );
}

function getMainThread() {
  return currentThreadFront.actor;
}

async function getSourceActorBreakpointPositions(
  { thread, actor },
  range
) {
  const linePositions = await ThreadFront.getBreakpointPositionsCompressed(actor, range);
  const rv = {};
  linePositions.forEach(({ line, columns }) => (rv[line] = columns));
  return rv;
}

async function getSourceActorBreakableLines({
  thread,
  actor,
}) {
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
  createObjectFront,
  loadObjectProperties,
  releaseActor,
  interrupt,
  pauseGrip,
  resume,
  stepIn,
  stepOut,
  stepOver,
  rewind,
  reverseStepOver,
  breakOnNext,
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
  fetchThreadSources,
  checkIfAlreadyPaused,
  registerSourceActor,
  fetchThreads,
  getMainThread,
  sendPacket,
  setSkipPausing,
  setEventListenerBreakpoints,
  getFrontByID,
  fetchAncestorFramePositions,
  pickExecutionPoints,
};

export { setupCommands, clientCommands };
