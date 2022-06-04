// Logpoints are used to perform evaluations at sets of execution points in the
// recording being debugged. They are implemented using the RRP Analysis domain.
// This file manages logpoint state, for setting/removing logpoints and emitting
// events which the webconsole listens to.
//
// Each logpoint has an associated log group ID, used to manipulate all the
// messages associated with the logpoint atomically.

import { AnalysisEntry, ExecutionPoint, Location, PointDescription } from "@replayio/protocol";
import { exceptionLogpointErrorReceived } from "devtools/client/webconsole/reducers/messages";
import { EventId } from "devtools/server/actors/utils/event-breakpoints";
import { UIStore } from "ui/actions";
import { getAnalysisPointsForLocation, setAnalysisError, setAnalysisPoints } from "ui/reducers/app";
import { ProtocolError } from "ui/state/app";

import analysisManager, { AnalysisHandler, AnalysisParams } from "protocol/analysisManager";
import { logpointGetFrameworkEventListeners } from "./event-listeners";
import { ThreadFront, ValueFront, Pause, createPrimitiveValueFront } from "protocol/thread";
import { PrimitiveValue } from "protocol/thread/value";
import { createAnalysis, Analysis, AnalysisError } from "protocol/thread/analysis";
import { assert, compareNumericStrings } from "protocol/utils";
import {
  analysisCreated,
  analysisErrored,
  analysisPointsReceived,
  analysisPointsRequested,
  analysisResultsReceived,
  analysisResultsRequested,
} from "devtools/client/debugger/src/reducers/breakpoints";
import { getFocusRegion } from "ui/reducers/timeline";
import { UnsafeFocusRegion } from "ui/state/timeline";

const TOO_MANY_HITS_TO_SHOW = 1000;

// TODO Ideally this file shouldn't know about a Redux store at all.
// Currently, it dispatches actions and reads state once.
export const LogpointHandlers: {
  onResult?: (
    logGroupId: string,
    key: ExecutionPoint,
    time: number,
    mappedLocation: Location,
    pause: Pause | undefined,
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

let store: UIStore;
export function setupLogpoints(_store: UIStore) {
  store = _store;
  analysisManager.init();
}

function showLogpointsLoading(logGroupId: string, points: PointDescription[]) {
  if (!LogpointHandlers.onPointLoading || points.length >= 200) {
    return;
  }

  points.forEach(async ({ point, time, frame }) => {
    if (!frame) {
      return;
    }
    const location = await ThreadFront.getPreferredLocation(frame);
    assert(location, "preferred location not found");
    LogpointHandlers.onPointLoading!(logGroupId, point, time, location);
  });
}

function showLogpointsResult(logGroupId: string, result: AnalysisEntry[]) {
  if (!LogpointHandlers.onResult || result.length >= 200) {
    return;
  }

  result.forEach(
    async ({
      key: point,
      value: { time, pauseId, location, values, data, frameworkListeners },
    }) => {
      await ThreadFront.ensureAllSources();
      const pause = new Pause(ThreadFront);
      pause.instantiate(pauseId, point, time, /* hasFrames */ true);
      pause.addData(data);
      const valueFronts = values.map((v: any) => new ValueFront(pause, v));
      const mappedLocation = await ThreadFront.getPreferredMappedLocation(location[0]);
      assert(mappedLocation, "preferred mapped location not found");
      LogpointHandlers.onResult!(logGroupId, point, time, mappedLocation, pause, valueFronts);

      if (frameworkListeners) {
        const frameworkListenersFront = new ValueFront(pause, frameworkListeners);
        findFrameworkListeners(logGroupId, point, frameworkListenersFront);
      }
    }
  );
}

async function showPrimitiveLogpoints(
  logGroupId: string,
  pointDescriptions: PointDescription[],
  values: ValueFront[]
) {
  if (!LogpointHandlers.onResult || pointDescriptions.length >= TOO_MANY_HITS_TO_SHOW) {
    return;
  }

  for (const pointDescription of pointDescriptions) {
    const { point, time, frame } = pointDescription;
    assert(frame, "pointDescription.frame not set");
    const location = await ThreadFront.getPreferredLocation(frame);
    assert(location, "preferred location not found");
    LogpointHandlers.onResult(logGroupId, point, time, location, undefined, values);
  }
}

function saveLogpointHits(
  points: PointDescription[],
  results: AnalysisEntry[],
  locations: Location[],
  condition: string
) {
  if (condition) {
    points = points.filter(point =>
      results.some(result => result.key === point.point && result.value.time === point.time)
    );
  }
  for (const location of locations) {
    store.dispatch(setAnalysisPoints({ analysisPoints: points, location, condition }));
  }
}

export function saveAnalysisError(locations: Location[], condition: string, error: AnalysisError) {
  for (const location of locations) {
    store.dispatch(setAnalysisError({ location, condition, error }));
  }
}

// Define some logpoint helpers to manage pause data.
export const Helpers = `
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

function formatLogpoint({ text, condition }: { text: string; condition: string }) {
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
  return mapper;
}

export async function setLogpoint(
  logGroupId: string,
  location: Location,
  text: string,
  condition: string
) {
  await ThreadFront.ensureAllSources();
  const sourceIds = ThreadFront.getCorrespondingSourceIds(location.sourceId);
  const { line, column } = location;
  const locations = sourceIds.map(sourceId => ({ sourceId, line, column }));
  setMultiSourceLogpoint(logGroupId, locations, text, condition);
}

// This should really be a thunk that creates a Breakpoint in the breakpoints
// slice, and an accompanying analysis in the analysis slice, and those two can
// watch *each other* to be informed of actions they might need to take.
async function setMultiSourceLogpoint(
  logGroupId: string,
  locations: Location[],
  text: string,
  condition: string
) {
  const primitives = primitiveValues(text);
  const primitiveFronts = primitives?.map(literal => createPrimitiveValueFront(literal));

  if (primitiveFronts) {
    // TODO We're getting an _array_ of locations, but only using the first one?
    const points = getAnalysisPointsForLocation(store.getState(), locations[0], condition);
    if (points) {
      if (!points.error) {
        showPrimitiveLogpoints(logGroupId, points.data || [], primitiveFronts);
      }
      return;
    }
  }

  await Promise.all(
    locations.map(({ sourceId }) => ThreadFront.getBreakpointPositionsCompressed(sourceId))
  );

  const focusRegion = getFocusRegion(store.getState());
  const mapper = formatLogpoint({ text, condition });
  const sessionId = await ThreadFront.waitForSession();
  const params: AnalysisParams = {
    sessionId,
    mapper,
    effectful: true,
    locations: locations.map(location => ({ location })),
  };

  if (focusRegion) {
    params.range = {
      begin: (focusRegion as UnsafeFocusRegion).start.point,
      end: (focusRegion as UnsafeFocusRegion).end.point,
    };
  }

  let analysis: Analysis;
  try {
    analysis = await createAnalysis(params);
    const { analysisId } = analysis;

    store.dispatch(analysisCreated({ analysisId, location: locations[0], condition }));

    await Promise.all(locations.map(location => analysis.addLocation(location)));

    store.dispatch(analysisPointsRequested(analysisId));
    const { points, error } = await analysis.findPoints();

    let analysisResults: AnalysisEntry[] = [];

    // The analysis points may have arrived in any order, so we have to sort
    // them after they arrive.
    points.sort((a, b) => compareNumericStrings(a.point, b.point));

    if (error) {
      store.dispatch(
        analysisErrored({
          analysisId,
          error: AnalysisError.TooManyPointsToFind,
          points,
        })
      );

      // TODO Remove this and change Redux logic to match
      saveAnalysisError(locations, condition, AnalysisError.TooManyPointsToFind);

      return;
    }

    store.dispatch(
      analysisPointsReceived({
        analysisId,
        points,
      })
    );

    if (!condition) {
      if (primitiveFronts) {
        showPrimitiveLogpoints(logGroupId, points, primitiveFronts);
      } else {
        showLogpointsLoading(logGroupId, points);
      }
    }

    const shouldGetResults = condition || !primitives;

    if (shouldGetResults && points.length <= 200) {
      store.dispatch(analysisResultsRequested(analysisId));

      const { results, error: runError } = await analysis.runAnalysis();

      analysisResults = results;

      if (runError) {
        store.dispatch(
          analysisErrored({
            analysisId,
            error: AnalysisError.TooManyPointsToRun,
            results,
          })
        );

        // TODO Remove this and change Redux logic to match
        // This is not right I think. The error could also be Unknown, we need
        // to check to know for sure.
        saveAnalysisError(locations, condition, AnalysisError.TooManyPointsToRun);
        return;
      }

      store.dispatch(
        analysisResultsReceived({
          analysisId,
          results,
        })
      );

      showLogpointsResult(logGroupId, results);
    }

    // TODO Remove this and redo Redux logic
    saveLogpointHits(points, analysisResults, locations, condition);

    // MAYBE
    // Rather than running *this* analysis, create a *new* analysis which only has
    // the found points which fall *inside* of our current focusRegion, and run *that*.
  } finally {
    await analysis!.releaseAnalysis();
  }
}

function primitiveValues(text: string) {
  const values = text.split(",").map(s => s.trim());
  const primitives: PrimitiveValue[] = [];
  for (const value of values) {
    if (value === "true") {
      primitives.push(true);
      continue;
    }
    if (value === "false") {
      primitives.push(false);
      continue;
    }
    if (value === "null") {
      primitives.push(null);
      continue;
    }
    if (value === "undefined") {
      primitives.push(undefined);
      continue;
    }
    if (/^-?(\d+|\d*\.\d+)$/.test(value)) {
      primitives.push(parseFloat(value));
      continue;
    }
    if (
      value.startsWith('"') &&
      value.endsWith('"') &&
      !value.substring(1, value.length - 1).includes('"')
    ) {
      primitives.push(value.substring(1, value.length - 1));
      continue;
    }
    return undefined;
  }
  return primitives;
}

export function setLogpointByURL(
  logGroupId: string,
  url: string,
  line: number,
  column: number,
  text: string,
  condition: string
) {
  const sourceIds = ThreadFront.getChosenSourceIdsForUrl(url).map(({ sourceId }) => sourceId);
  if (sourceIds.length === 0) {
    return;
  }
  const locations = sourceIds.map(sourceId => ({ sourceId, line, column }));
  setMultiSourceLogpoint(logGroupId, locations, text, condition);
}

const eventTypePoints: Record<string, PointDescription[]> = {};
const eventTypeLogGroupId: Record<string, string> = {};

export async function fetchEventTypePoints(eventTypes: EventId[]) {
  const sessionId = await ThreadFront.waitForSession();

  await Promise.all(
    eventTypes.map(async eventType => {
      const collectedPoints: PointDescription[] = [];
      await analysisManager.runAnalysis(
        {
          sessionId,
          mapper: `return [{ key: input.point, value: input }];`,
          effectful: false,
          eventHandlerEntryPoints: [{ eventType }],
        },
        {
          onAnalysisPoints: points => collectedPoints.push(...points),
        }
      );
      eventTypePoints[eventType] = collectedPoints;
      return collectedPoints;
    })
  );

  return eventTypePoints;
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

export function newLogGroupId() {
  return `logGroup-${Math.random()}`;
}

export async function setEventLogpoints(eventTypes: string[]) {
  for (const eventType in eventTypeLogGroupId) {
    if (eventTypes.indexOf(eventType) < 0) {
      removeLogpoint(eventTypeLogGroupId[eventType]);
      delete eventTypeLogGroupId[eventType];
    }
  }
  for (const eventType of eventTypes) {
    if (!eventTypeLogGroupId[eventType]) {
      const logGroupId = newLogGroupId();
      eventTypeLogGroupId[eventType] = logGroupId;
      setEventLogpoint(logGroupId, [eventType], eventTypePoints[eventType]);
    }
  }
}

export async function setEventLogpoint(
  logGroupId: string,
  eventTypes: string[],
  points?: PointDescription[]
) {
  const mapper = eventLogpointMapper(/* getFrameworkListeners */ true);
  const sessionId = await ThreadFront.waitForSession();
  const params: AnalysisParams = {
    sessionId,
    mapper,
    effectful: true,
    eventHandlerEntryPoints: eventTypes.map(eventType => ({ eventType })),
  };
  const handler: AnalysisHandler<void> = {
    onAnalysisResult: result => showLogpointsResult(logGroupId, result),
  };
  if (points) {
    showLogpointsLoading(logGroupId, points);
  } else {
    handler.onAnalysisPoints = points => showLogpointsLoading(logGroupId, points);
  }

  await analysisManager.runAnalysis(params, handler);
}

async function findFrameworkListeners(
  logGroupId: string,
  point: ExecutionPoint,
  frameworkListeners: ValueFront
) {
  const locations = [];
  await frameworkListeners.loadProperties();
  const propertyValues = frameworkListeners.previewValueMap().values();
  for (const value of propertyValues) {
    if (value.isObject() && value.className() == "Function") {
      locations.push(value.functionLocationFromLogpoint()!);
    }
  }
  if (!locations.length) {
    return;
  }

  const mapper = eventLogpointMapper(/* getFrameworkListeners */ false);
  const sessionId = await ThreadFront.waitForSession();
  const params: AnalysisParams = {
    sessionId,
    mapper,
    effectful: true,
    locations: locations.map(location => ({ location, onStackFrame: point })),
  };
  const handler: AnalysisHandler<void> = {
    onAnalysisPoints: points => showLogpointsLoading(logGroupId, points),
    onAnalysisResult: result => showLogpointsResult(logGroupId, result),
  };

  await analysisManager.runAnalysis(params, handler);
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

  const sessionId = await ThreadFront.waitForSession();
  const params: AnalysisParams = {
    sessionId,
    mapper,
    effectful: true,
    exceptionPoints: true,
  };
  const handler: AnalysisHandler<void> = {
    onAnalysisPoints: points => showLogpointsLoading(logGroupId, points),
    onAnalysisResult: result => showLogpointsResult(logGroupId, result),
  };

  try {
    await analysisManager.runAnalysis(params, handler);
  } catch (e: any) {
    removeLogpoint(logGroupId);
    let msg;
    if (e.code === ProtocolError.TooManyPoints) {
      msg = "There are too many exceptions. Please focus to a smaller time range and try again.";
    } else {
      msg = "An error occured while fetching exceptions. Try again.";
    }

    store.dispatch(exceptionLogpointErrorReceived(msg));
  }
}

export function removeLogpoint(logGroupId: string) {
  if (LogpointHandlers.clearLogpoint) {
    LogpointHandlers.clearLogpoint(logGroupId);
  }
}
