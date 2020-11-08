// Logpoints are used to perform evaluations at sets of execution points in the
// recording being debugged. They are implemented using the RRP Analysis domain.
// This file manages logpoint state, for setting/removing logpoints and emitting
// events which the webconsole listens to.
//
// Each logpoint has an associated log group ID, used to manipulate all the
// messages associated with the logpoint atomically.

import {
  AnalysisId,
  createAnalysisResult,
  ExecutionPoint,
  Location,
  PointDescription,
} from "record-replay-protocol";
import { client, log } from "./socket";
import { defer } from "./utils";
import { ThreadFront, ValueFront, Pause } from "./thread";
const { logpointGetFrameworkEventListeners } = require("./event-listeners");

interface LogpointInfo {
  analysisWaiters: Promise<createAnalysisResult>[];
  points: PointDescription[];
  pointsWaiter?: (value: void) => void;
}

// Map log group ID to information about the logpoint.
const gLogpoints = new Map<string, LogpointInfo>();

// Map analysis ID to log group ID.
const gAnalysisLogGroupIDs = new Map<AnalysisId, string>();

// Hooks for adding messages to the console.
export const LogpointHandlers: {
  onResult?: (
    logGroupId: string,
    key: ExecutionPoint,
    time: number,
    mappedLocation: Location,
    pause: Pause,
    valueFronts: ValueFront[]
  ) => void;
  onPointLoading?: (
    logGroupId: string,
    point: ExecutionPoint,
    time: number,
    location: Location
  ) => void;
  clearLogpoint?: (logGroupId: string) => void;
} = {};

client.Analysis.addAnalysisResultListener(({ analysisId, results }) => {
  log(`AnalysisResults ${results.length}`);

  const logGroupId = gAnalysisLogGroupIDs.get(analysisId)!;
  if (!gLogpoints.has(logGroupId)) {
    return;
  }

  if (LogpointHandlers.onResult) {
    results.forEach(
      async ({ key, value: { time, pauseId, location, values, data, frameworkListeners } }) => {
        const pause = new Pause(ThreadFront.sessionId!);
        pause.instantiate(pauseId);
        pause.addData(data);
        const valueFronts = values.map((v: any) => new ValueFront(pause, v));
        const mappedLocation = await ThreadFront.getPreferredMappedLocation(location[0]);
        LogpointHandlers.onResult!(logGroupId, key, time, mappedLocation, pause, valueFronts);

        if (frameworkListeners) {
          const frameworkListenersFront = new ValueFront(pause, frameworkListeners);
          eventLogpointOnFrameworkListeners(logGroupId, key, frameworkListenersFront);
        }
      }
    );
  }
});

client.Analysis.addAnalysisPointsListener(({ analysisId, points }) => {
  log(`AnalysisPoints ${points.length}`);

  const logGroupId = gAnalysisLogGroupIDs.get(analysisId)!;
  const info = gLogpoints.get(logGroupId);
  if (!info) {
    return;
  }

  info.points.push(...points);
  if (info.pointsWaiter) {
    info.pointsWaiter();
  }

  if (LogpointHandlers.onPointLoading) {
    points.forEach(async ({ point, time, frame }) => {
      if (!frame) return;
      const location = await ThreadFront.getPreferredLocation(frame);
      LogpointHandlers.onPointLoading!(logGroupId, point, time, location);
    });
  }
});

async function createLogpointAnalysis(logGroupId: string, mapper: string) {
  if (!gLogpoints.has(logGroupId)) {
    gLogpoints.set(logGroupId, { analysisWaiters: [], points: [] });
  }

  const waiter = client.Analysis.createAnalysis({
    mapper,
    effectful: true,
  });
  gLogpoints.get(logGroupId)!.analysisWaiters.push(waiter);

  const { analysisId } = await waiter;
  gAnalysisLogGroupIDs.set(analysisId, logGroupId);
  return analysisId;
}

// Define some logpoint helpers to manage pause data.
const Helpers = `
  const finalData = { frames: [], scopes: [], objects: [] };
  function addPauseData({ frames, scopes, objects }) {
    finalData.frames.push(...(frames || []));
    finalData.scopes.push(...(scopes || []));
    finalData.objects.push(...(objects || []));
  }
  function getTopFrame() {
    const { frame, data } = sendCommand("Pause.getTopFrame");
    addPauseData(data);
    return finalData.frames.find(f => f.frameId == frame);
  }
`;

// Given an RRP value representing an array, add the elements of that array to
// the given values/data arrays.
function mapperExtractArrayContents(arrayPath: string, valuesPath: string) {
  return `{
    const { object } = ${arrayPath};
    const { result: lengthResult } = sendCommand(
      "Pause.getObjectProperty",
      { object, name: "length" }
    );
    addPauseData(lengthResult.data);
    const length = lengthResult.returned.value;
    for (let i = 0; i < length; i++) {
      const { result: elementResult } = sendCommand(
        "Pause.getObjectProperty",
        { object, name: i.toString() }
      );
      ${valuesPath}.push(elementResult.returned);
      addPauseData(elementResult.data);
    }
  }`;
}

export async function setLogpoint(
  logGroupId: string,
  sourceId: string,
  line: number,
  column: number,
  text: string,
  condition: string
) {
  let conditionSection = "";
  if (condition) {
    // When there is a condition, don't add a message if it returns undefined
    // or a falsy primitive.
    conditionSection = `
      const { result: conditionResult } = sendCommand(
        "Pause.evaluateInFrame",
        { frameId, expression: ${JSON.stringify(condition)}, useOriginalScopes: true }
      );
      addPauseData(conditionResult.data);
      if (conditionResult.returned) {
        const { returned } = conditionResult;
        if ("value" in returned && !returned.value) {
          return [];
        }
        if (!Object.keys(returned).length) {
          // Undefined.
          return [];
        }
      }
    `;
  }

  const mapper = `
    ${Helpers}
    const { point, time, pauseId } = input;
    const { frameId, functionName, location } = getTopFrame();
    ${conditionSection}
    const bindings = [
      { name: "displayName", value: functionName || "" }
    ];
    const { result } = sendCommand("Pause.evaluateInFrame", {
      frameId,
      bindings,
      expression: "[" + ${JSON.stringify(text)} + "]",
      useOriginalScopes: true,
    });
    const values = [];
    addPauseData(result.data);
    if (result.exception) {
      values.push(result.exception);
    } else {
      ${mapperExtractArrayContents("result.returned", "values")}
    }
    return [{
      key: point,
      value: { time, pauseId, location, values, data: finalData },
    }];
  `;

  const analysisId = await createLogpointAnalysis(logGroupId, mapper);

  client.Analysis.addLocation({
    analysisId,
    sessionId: await ThreadFront.waitForSession(),
    location: { sourceId, line, column },
  });
  client.Analysis.runAnalysis({ analysisId });

  // Don't add loading messages for conditional logpoints, as we don't know if
  // analysis points will actually generate a message.
  if (!condition) {
    client.Analysis.findAnalysisPoints({ analysisId });
  }
}

export function setLogpointByURL(
  logGroupId: string,
  url: string,
  line: number,
  column: number,
  text: string,
  condition: string
) {
  const sourceIds = ThreadFront.getSourceIdsForURL(url);
  (sourceIds || []).forEach((sourceId: string) => {
    setLogpoint(logGroupId, sourceId, line, column, text, condition);
  });
}

// Event listener logpoints use a multistage analysis. First, the normal
// logpoint analysis runs to generate points for the points where regular
// DOM event listeners are called by the browser. During this first analysis,
// we look for framework event listeners attached to the nodes that are
// targeted by the discovered events.
//
// In the second phase, we create a new analysis for each point which framework
// event listeners are associated with. This analysis runs against each call
// to the framework event listener during the scope of the regular DOM event
// listener.
function eventLogpointMapper(getFrameworkListeners: boolean) {
  let frameworkText = "";
  if (getFrameworkListeners) {
    frameworkText = logpointGetFrameworkEventListeners("frameId", "frameworkListeners");
  }
  return `
    ${Helpers}
    const { point, time, pauseId } = input;
    const { frameId, location } = getTopFrame();
    const { result } = sendCommand(
      "Pause.evaluateInFrame",
      { frameId, expression: "[...arguments]" }
    );
    const values = [];
    addPauseData(result.data);
    if (result.exception) {
      values.push(result.exception);
    } else {
      ${mapperExtractArrayContents("result.returned", "values")}
    }
    let frameworkListeners;
    ${frameworkText}
    return [{
      key: point,
      value: { time, pauseId, location, values, data: finalData, frameworkListeners },
    }];
  `;
}

export async function setEventLogpoint(logGroupId: string, eventTypes: string[]) {
  const mapper = eventLogpointMapper(/* getFrameworkListeners */ true);
  const analysisId = await createLogpointAnalysis(logGroupId, mapper);

  for (const eventType of eventTypes) {
    client.Analysis.addEventHandlerEntryPoints({
      analysisId,
      sessionId: await ThreadFront.waitForSession(),
      eventType,
    });
  }

  client.Analysis.runAnalysis({ analysisId });
  client.Analysis.findAnalysisPoints({ analysisId });
}

async function eventLogpointOnFrameworkListeners(
  logGroupId: string,
  point: ExecutionPoint,
  frameworkListeners: any
) {
  const locations = [];
  const children = await frameworkListeners.loadChildren();
  for (const { contents } of children) {
    if (contents.isObject() && contents.className() == "Function") {
      locations.push(contents.functionLocationFromLogpoint());
    }
  }
  if (!locations.length) {
    return;
  }

  const mapper = eventLogpointMapper(/* getFrameworkListeners */ false);
  const analysisId = await createLogpointAnalysis(logGroupId, mapper);

  for (const location of locations) {
    client.Analysis.addLocation({
      analysisId,
      sessionId: await ThreadFront.waitForSession(),
      location,
      onStackFrame: point,
    });
  }

  client.Analysis.runAnalysis({ analysisId });
  client.Analysis.findAnalysisPoints({ analysisId });
}

export async function setExceptionLogpoint(logGroupId: string) {
  const mapper = `
    ${Helpers}
    const { point, time, pauseId } = input;
    const { frameId, location } = getTopFrame();
    const { exception, data: exceptionData } = sendCommand("Pause.getExceptionValue");
    addPauseData(exceptionData);
    const values = [{ value: "Exception" }, exception];
    return [{
      key: point,
      value: { time, pauseId, location, values, data: finalData },
    }];
  `;

  const analysisId = await createLogpointAnalysis(logGroupId, mapper);

  client.Analysis.addExceptionPoints({
    analysisId,
    sessionId: await ThreadFront.waitForSession(),
  });

  client.Analysis.runAnalysis({ analysisId });
  client.Analysis.findAnalysisPoints({ analysisId });
}

// Add logpoint messages at random function entry points, and returns text
// patterns that will appear in the resulting messages. This is used by
// automated tests.
export async function setRandomLogpoint(numLogs: number) {
  const mapper = `
    const { point, time, pauseId} = input;
    const { frameId, location } = getTopFrame();
    const { result } = sendCommand("Pause.evaluateInFrame", {
      frameId,
      expression: "String([...arguments]).substring(0, 200)",
    });
    const v = result.returned ? String(result.returned.value) : "";
    const values = [{ value: point + ": " + v }];
    return [{ key: point, value: { time, pauseId, location, values, data: {} } }];
  `;

  const logGroupId = Math.random().toString();
  const analysisId = await createLogpointAnalysis(logGroupId, mapper);

  client.Analysis.addRandomPoints({
    analysisId,
    sessionId: await ThreadFront.waitForSession(),
    numPoints: numLogs,
  });

  client.Analysis.runAnalysis({ analysisId });
  client.Analysis.findAnalysisPoints({ analysisId });

  const info = gLogpoints.get(logGroupId)!;
  while (info.points.length < numLogs) {
    const { promise, resolve } = defer<void>();
    info.pointsWaiter = resolve;
    await promise;
  }

  return info.points.map(p => p.point);
}

export function removeLogpoint(logGroupId: string) {
  const info = gLogpoints.get(logGroupId);
  if (!info) {
    return;
  }
  if (LogpointHandlers.clearLogpoint) {
    LogpointHandlers.clearLogpoint(logGroupId);
  }
  gLogpoints.delete(logGroupId);
  info.analysisWaiters.forEach(async (waiter: Promise<{ analysisId: string }>) => {
    const test = await waiter;
    console.log(test);
    const { analysisId } = await waiter;
    client.Analysis.releaseAnalysis({ analysisId });
  });
}
