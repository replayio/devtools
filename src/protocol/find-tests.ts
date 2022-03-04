// Perform some analysis to find and describe automated tests that were recorded.

import { Pause, ThreadFront, ValueFront } from "./thread";
import analysisManager, { AnalysisHandler, AnalysisParams } from "./analysisManager";
import { Helpers } from "./logpoint";
import { assert } from "protocol/utils";
import { client } from "./socket";
import { comparePoints, pointPrecedes } from "./execution-point-utils";
import {
  AnalysisEntry,
  ExecutionPoint,
  Message,
  Location,
  PointDescription,
} from "@recordreplay/protocol";

// Information about a jest test which ran in the recording.
interface JestTestInfo {
  // Hierarchical names for this test, from child to parent.
  names: string[];

  // Start point of the test.
  startPoint: PointDescription;

  // If the test failed, the place where it failed at.
  errorPoint?: PointDescription;

  // If the test failed, description of the failure.
  errorText?: string;

  // If the test failed, whether errorPoint is an exception site.
  errorException?: boolean;
}

// Mapper returning analysis results for jest test callback invocations
// which are associated with a test instead of a hook, returning the name
// of the test and the point where the callback is invoked.
const JestTestMapper = `
${Helpers}
const { point, time, pauseId } = input;
const { frameId, functionName } = getTopFrame();
const { result: isHookResult } = sendCommand("Pause.evaluateInFrame", {
  frameId,
  expression: "isHook",
});
if (isHookResult.returned && isHookResult.returned.value) {
  return [];
}
const names = [];
const nameExpressions = [
  "testOrHook.name",
  "testOrHook.parent.name",
  "testOrHook.parent.parent.name",
  "testOrHook.parent.parent.parent.name",
  "testOrHook.parent.parent.parent.parent.name",
  "testOrHook.parent.parent.parent.parent.parent.name",
];
for (const expression of nameExpressions) {
  const { result: nameResult } = sendCommand("Pause.evaluateInFrame", {
    frameId,
    expression,
  });
  if (nameResult.returned && nameResult.returned.value) {
    names.push(nameResult.returned.value);
  } else {
    break;
  }
}
return [{
  key: point,
  value: { names },
}];
`;

// Mapper extracting the "name" and "message" properties from a thrown exception
// for use in test failure messages.
const JestExceptionMapper = `
${Helpers}
const { point, time, pauseId } = input;
const { frameId, location } = getTopFrame();
const { exception, data: exceptionData } = sendCommand("Pause.getExceptionValue");
addPauseData(exceptionData);
return [{
  key: point,
  value: { time, pauseId, location, exception, data: finalData },
}];
`;

// Manages the state associated with any jest tests within the recording.
class JestTestState {
  sessionId: string;

  // Locations where the inner callback passed to callAsyncCircusFn is invoked,
  // starting the test or hook.
  invokeCallbackLocations: Location[];

  // Location of the catch block which indicates a test failure.
  catchBlockLocation: Location;

  // Any tests we found.
  tests: JestTestInfo[] = [];

  constructor(invokeCallbackLocations: Location[], catchBlockLocation: Location) {
    assert(ThreadFront.sessionId, "no sessionId");
    this.sessionId = ThreadFront.sessionId;

    this.invokeCallbackLocations = invokeCallbackLocations;
    this.catchBlockLocation = catchBlockLocation;
  }

  async loadTests() {
    const params: AnalysisParams = {
      sessionId: this.sessionId,
      mapper: JestTestMapper,
      effectful: true,
      locations: this.invokeCallbackLocations.map(location => ({ location })),
    };

    const analysisResults: AnalysisEntry[] = [];

    const handler: AnalysisHandler<void> = {};
    handler.onAnalysisResult = results => analysisResults.push(...results);

    await analysisManager.runAnalysis(params, handler);

    await Promise.all(
      analysisResults.map(async ({ key: callPoint, value: { names } }) => {
        const { target } = await client.Debugger.findStepInTarget(
          { point: callPoint },
          this.sessionId
        );
        if (target.frame) {
          this.tests.push({ names, startPoint: target });
        }
      })
    );

    this.tests.sort((a, b) => comparePoints(a.startPoint.point, b.startPoint.point));
  }

  async loadFailures() {
    const failurePoints = await this.getFailurePoints();
    if (!failurePoints.length) {
      return;
    }

    let exceptionPoints: PointDescription[] = [];
    try {
      exceptionPoints = await this.getExceptionPoints();
    } catch (e) {
      // If there are too many exception sites in the recording we won't be able to
      // associate test failures with the most recent exception.
      // See https://github.com/RecordReplay/devtools/issues/5534
    }

    // Exceptions which are associated with a test failure.
    const failureExceptionPoints: PointDescription[] = [];

    await Promise.all(
      failurePoints.map(async point => {
        // Associate this failure with the most recent test.
        const test = this.mostRecentTest(point.point);
        if (!test || test.errorPoint) {
          return;
        }

        const exceptionPoint = this.mostRecentPoint(point.point, exceptionPoints);
        if (exceptionPoint && pointPrecedes(test.startPoint.point, exceptionPoint.point)) {
          test.errorPoint = exceptionPoint;
          test.errorException = true;
          failureExceptionPoints.push(exceptionPoint);
        } else {
          test.errorPoint = point;
          test.errorException = false;
        }
      })
    );

    if (!failureExceptionPoints.length) {
      return;
    }

    const params: AnalysisParams = {
      sessionId: this.sessionId,
      mapper: JestExceptionMapper,
      effectful: true,
      points: failureExceptionPoints.map(p => p.point),
    };

    const analysisResults: AnalysisEntry[] = [];

    const handler: AnalysisHandler<void> = {};
    handler.onAnalysisResult = results => analysisResults.push(...results);

    await analysisManager.runAnalysis(params, handler);

    await Promise.all(
      this.tests.map(async test => {
        if (!test.errorException) {
          return;
        }
        assert(test.errorPoint, "errorException without errorPoint");

        const result = analysisResults.find(r => r.key == test.errorPoint?.point);
        if (!result) {
          test.errorText = "unknown exception";
          return;
        }

        const { time, pauseId, location, exception, data } = result.value;

        const pause = new Pause(ThreadFront.sessionId!);
        pause.addData(data);
        pause.instantiate(pauseId, test.errorPoint.point, time, /* hasFrames */ true);
        const exceptionValue = new ValueFront(pause, exception);

        const exceptionContents = exceptionValue.previewValueMap();
        const exceptionProperty = exceptionContents.get("message") || exceptionContents.get("name");
        if (exceptionProperty && exceptionProperty.isString()) {
          test.errorText = String(exceptionProperty.primitive());
        } else {
          test.errorText = "unknown exception";
        }
      })
    );
  }

  // Get the points where test failures occurred.
  private async getFailurePoints(): Promise<PointDescription[]> {
    const params: AnalysisParams = {
      sessionId: this.sessionId,
      mapper: "",
      effectful: true,
      locations: [{ location: this.catchBlockLocation }],
    };

    const handler: AnalysisHandler<void> = {};
    const failurePoints: PointDescription[] = [];

    handler.onAnalysisPoints = points => failurePoints.push(...points);
    await analysisManager.runAnalysis(params, handler);

    return failurePoints;
  }

  // Get a sorted array of the points where exceptions were thrown.
  private async getExceptionPoints(): Promise<PointDescription[]> {
    const params: AnalysisParams = {
      sessionId: this.sessionId,
      mapper: "",
      effectful: true,
      exceptionPoints: true,
    };

    const handler: AnalysisHandler<void> = {};
    const exceptionPoints: PointDescription[] = [];

    handler.onAnalysisPoints = points => exceptionPoints.push(...points);
    await analysisManager.runAnalysis(params, handler);

    exceptionPoints.sort((a, b) => comparePoints(a.point, b.point));

    return exceptionPoints;
  }

  private mostRecentTest(point: ExecutionPoint): JestTestInfo | null {
    for (let i = 0; i < this.tests.length; i++) {
      if (pointPrecedes(point, this.tests[i].startPoint.point)) {
        return i ? this.tests[i - 1] : null;
      }
    }
    return null;
  }

  private mostRecentPoint(
    point: ExecutionPoint,
    pointArray: PointDescription[]
  ): PointDescription | null {
    for (let i = 0; i < pointArray.length; i++) {
      if (pointPrecedes(point, pointArray[i].point)) {
        return i ? pointArray[i - 1] : null;
      }
    }
    return null;
  }
}

// Look for a source containing the specified pattern.
async function findMatchingSourceId(pattern: string): Promise<string | null> {
  await ThreadFront.ensureAllSources();
  for (const [sourceId, source] of ThreadFront.sources.entries()) {
    if (source.url?.includes(pattern)) {
      return sourceId;
    }
  }
  return null;
}

// Get the location of the first breakpoint on the specified line.
// Note: This requires a linear scan of the lines containing breakpoints
// and will be inefficient if used on large sources.
async function getBreakpointLocationOnLine(
  sourceId: string,
  targetLine: number
): Promise<Location | null> {
  const breakpointPositions = await ThreadFront.getBreakpointPositionsCompressed(sourceId);
  for (const { line, columns } of breakpointPositions) {
    if (line == targetLine && columns.length) {
      return { sourceId, line, column: columns[0] };
    }
  }
  return null;
}

// Look for places in the recording used to run jest tests.
async function setupJestTests(): Promise<JestTestState | null> {
  // Look for a source containing the callAsyncCircusFn function which is used to
  // run tests using recent versions of Jest.
  const circusUtilsSourceId = await findMatchingSourceId("jest-circus/build/utils.js");
  if (!circusUtilsSourceId) {
    return null;
  }

  const { contents } = await ThreadFront.getSourceContents(circusUtilsSourceId);
  const lines = contents.split("\n");

  // Whether we've seen the start of the callAsyncCircusFn function.
  let foundCallAsyncCircusFn = false;

  const invokeCallbackLocations: Location[] = [];
  let catchBlockLocation: Location | undefined;

  // Whether we are inside the callAsyncCircusFn catch block.
  let insideCatchBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const lineContents = lines[i];
    const line = i + 1;

    if (lineContents.includes("const callAsyncCircusFn = ")) {
      foundCallAsyncCircusFn = true;
    }

    if (!foundCallAsyncCircusFn) {
      continue;
    }

    // Lines invoking the callback start with "returnedValue = ..."
    // except when setting the initial undefined value of returnedValue.
    if (
      lineContents.includes("returnedValue = ") &&
      !lineContents.includes("returnedValue = undefined")
    ) {
      const location = await getBreakpointLocationOnLine(circusUtilsSourceId, line);
      if (location) {
        invokeCallbackLocations.push(location);
      }
    }

    if (lineContents.includes(".catch(error => {")) {
      insideCatchBlock = true;
    }

    // We should be able to break at this line in the catch block.
    if (insideCatchBlock && lineContents.includes("completed = true")) {
      const location = await getBreakpointLocationOnLine(circusUtilsSourceId, line);
      if (location) {
        catchBlockLocation = location;
      }
      break;
    }
  }

  // There should be three places where the inner callback can be invoked.
  if (invokeCallbackLocations.length != 3) {
    return null;
  }

  // We should have found a catch block location to break at.
  if (!catchBlockLocation) {
    return null;
  }

  return new JestTestState(invokeCallbackLocations, catchBlockLocation);
}

function removeTerminalColors(str: string): string {
  return str.replace(/\x1B[[(?);]{0,2}(;?\d)*./g, "");
}

async function findJestTests() {
  const state = await setupJestTests();
  if (!state) {
    return;
  }

  await state.loadTests();

  await Promise.all(
    state.tests.map(async ({ names, startPoint }) => {
      let name = names[0] || "<unknown>";
      for (let i = 1; i < names.length; i++) {
        if (names[i] != "ROOT_DESCRIBE_BLOCK") {
          name = names[i] + " \u25b6 " + name;
        }
      }
      const pause = ThreadFront.ensurePause(startPoint.point, startPoint.time);
      const pauseId = await pause.pauseIdWaiter.promise;
      TestMessageHandlers.onTestMessage?.({
        source: "ConsoleAPI",
        level: "info",
        text: `JestTest ${name}`,
        point: startPoint,
        pauseId,
        data: {},
      });
    })
  );

  await state.loadFailures();

  await Promise.all(
    state.tests.map(async ({ errorPoint, errorText }) => {
      if (!errorPoint) {
        return;
      }
      if (!errorText) {
        errorText = "unknown test failure";
      }
      errorText = removeTerminalColors(errorText);
      const pause = ThreadFront.ensurePause(errorPoint.point, errorPoint.time);
      const pauseId = await pause.pauseIdWaiter.promise;
      TestMessageHandlers.onTestMessage?.({
        source: "ConsoleAPI",
        level: "error",
        text: `JestFailure ${errorText}`,
        point: errorPoint,
        pauseId,
        data: {},
      });
    })
  );
}

// Look for automated tests associated with a recent version of jest.
export async function findAutomatedTests() {
  await findJestTests();
}

export const TestMessageHandlers: {
  onTestMessage?: (msg: Message) => void;
} = {};
