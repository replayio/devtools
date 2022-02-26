// Perform some analysis to find and describe automated tests that were recorded.

import { ThreadFront } from "protocol/thread/thread";
import analysisManager, { AnalysisHandler, AnalysisParams } from "./analysisManager";
import { Helpers } from "./logpoint";
import { assert } from "protocol/utils";
import { client } from "./socket";
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
  errorPoint?: ExecutionPoint;

  // If the test failed, description of the failure.
  errorText?: string;
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
    assert(ThreadFront.sessionId);
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

    await Promise.all(analysisResults.map(async ({ key: callPoint, value: { names } }) => {
      const { target } = await client.Debugger.findStepInTarget({ point: callPoint }, this.sessionId);
      if (target.frame) {
        this.tests.push({ names, startPoint: target });
      }
    }));
  }

  async loadFailures() {
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
async function getBreakpointLocationOnLine(sourceId: string, targetLine: number): Promise<Location | null> {
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
    if (lineContents.includes("returnedValue = ") &&
        !lineContents.includes("returnedValue = undefined")) {
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

async function findJestTests() {
  const state = await setupJestTests();
  if (!state) {
    return;
  }

  await state.loadTests();

  await Promise.all(state.tests.map(async ({ names, startPoint }) => {
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
  }));

  await state.loadFailures();
}

// Look for automated tests associated with a recent version of jest.
export async function findAutomatedTests() {
  await findJestTests();
}

export const TestMessageHandlers: {
  onTestMessage?: (msg: Message) => void;
} = {};
