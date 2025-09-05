import {
  ExecutionPoint,
  RequestId,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import { satisfies } from "compare-versions";

import { comparePoints } from "protocol/execution-point-utils";
import { binarySearch } from "protocol/utils";
import { networkRequestsCache } from "replay-next/src/suspense/NetworkRequestsCache";
import { insert } from "replay-next/src/utils/array";
import { assertWithTelemetry, recordData } from "replay-next/src/utils/telemetry";
import { ReplayClientInterface } from "shared/client/types";
import { Annotation, PlaywrightTestSources, PlaywrightTestStacks } from "shared/graphql/types";
import { maxTimeStampedPoint, minTimeStampedPoint } from "shared/utils/time";
import {
  AnnotationsCache,
  PlaywrightAnnotationsCache,
} from "ui/components/TestSuite/suspense/AnnotationsCache";

export type SemVer = string;

function assert(value: unknown, message: string, tags: Object = {}): asserts value {
  return assertWithTelemetry(value, message, "process-test-metadata", tags);
}

export type TestRunnerName = "cypress" | "playwright";

// This type is only minimally supported by the frontend
export namespace RecordingTestMetadataV1 {
  export type GroupedTestCases = {
    file?: string;
    path?: string[];
    result: RecordingTestMetadataV3.TestResult;
    run?: { id: string; title?: string };
    runner?: { name: TestRunnerName; version: string; plugin: string };
    tests?: TestRecording[];
    title: string;
    version: 1;
  };

  export type TestRecording = {
    duration?: number;
    error?: any;
    id?: string;
    path?: string[];
    relativePath?: string;
    relativeStartTime?: number;
    result: RecordingTestMetadataV3.TestResult;
    steps?: TestStep[];
    title: string;
  };

  export type TestStep = {
    alias?: string;
    args?: any[];
    assertIds?: string[];
    commandId?: string;
    error?: any;
    duration: number;
    hook?: "beforeAll" | "beforeEach" | "afterAll" | "afterEach";
    id: string;
    name: string;
    parentId?: string;
    relativeStartTime?: number;
  };
}

// This type is supported, but must be converted to version 3 format before use
export namespace RecordingTestMetadataV2 {
  export type GroupedTestCases = Omit<
    RecordingTestMetadataV3.GroupedTestCases,
    "runId" | "source" | "testRecordings"
  > & {
    run: { id: string };
    source: {
      path: string;
      title: string | null;
    };
    tests: TestRecording[];
  };

  export type TestRecording = Omit<
    RecordingTestMetadataV3.TestRecording,
    "events" | "timeStampedPointRange"
  > & {
    events: {
      afterAll: TestEvent[];
      afterEach: TestEvent[];
      beforeAll: TestEvent[];
      beforeEach: TestEvent[];
      main: TestEvent[];
    };
  };

  export type UserActionEventStack = Array<{
    column: number;
    file: string;
    function: string;
    line: number;
  }>;

  export type UserActionEvent = Omit<
    RecordingTestMetadataV3.UserActionEvent,
    "data" | "timeStampedPointRange"
  > & {
    data: {
      category: "assertion" | "command" | "other";
      command: {
        arguments: string[];
        name: string;
      };
      error: TestError | null;
      id: string;
      parentId: string | null;
      scope: string[] | null;
    };
  };

  export type TestEvent = UserActionEvent;

  export type TestError = {
    name: string;
    message: string;
  };
}

export namespace RecordingTestMetadataV3 {
  export type TestResult = "failed" | "passed" | "skipped" | "timedOut" | "unknown";

  export type TestSectionName = "afterAll" | "afterEach" | "beforeAll" | "beforeEach" | "main";

  export type TestEnvironmentError = {
    code: number;
    detail: string | null;
    name: string;
    message: string;
  };

  export interface GroupedTestCases {
    // Safe to use for display on Library page
    // Not accurate enough to use for setting focus region in DevTools
    approximateDuration: number;

    // Environment that generated the test results
    environment: {
      // Plug-in/integration errors (e.g. missing steps, no steps, mismatched annotations)
      // Empty array means there were no errors
      errors: Array<TestEnvironmentError>;

      pluginVersion: SemVer;

      // Cypress or Playwright
      testRunner: {
        name: TestRunnerName;
        version: SemVer;
      };
    };

    // High level summary of tests within this recording
    // based on same data as contained in the resultCounts map below
    result: TestResult;

    // Summarizes result of the test run
    resultCounts: Record<TestResult, number>;

    runId: string;

    // Version for test metadata/schema
    schemaVersion: SemVer;

    source: {
      // Relative path to source file
      filePath: string;

      // Only available for Playwright tests
      title: string | null;
    };

    // If a test fails, it may be executed multiple times (e.g. retries);
    // each of these attempts is tracked in the testRecordings array
    testRecordings: TestRecording[];

    // Playwright only
    testSources: PlaywrightTestSources | null;
  }

  export interface TestRecording {
    // Useful for identifying retries of a failed test
    attempt: number;

    testRunnerName: TestRunnerName;

    // An error that occurred for this test that was unrelated to a specific event
    // e.g. a JS runtime error in the cypress spec file
    error: TestError | null;

    // Actions that were part of this test, grouped by section (or "hook")
    events: Record<TestSectionName, TestEvent[]>;

    // Uniquely identifies a test within a group of tests
    // This can be used to differentiate multiple tests with the same name (and scope)
    // or retries of a single test after a failed attempt
    id: number;

    // Note that the client does not necessarily have any expectations of ordering here;
    // we will likely order results lexicographically, by title.
    result: TestResult;

    source: {
      // Example test:
      //   describe("outer", () => {
      //     describe("inner", () => {
      //       it("test name", () => {
      //         // Test code here...
      //       });
      //     });
      //   });

      // If a test is inside of one or more describe() blocks
      // For the example test above, this would be ["outer", "inner"]
      scope: string[];

      // For Cypress, the string passed to the it() block
      // For Playwright, the string passed to the test() block
      // For the example test above, this would be "test name"
      title: string;
    };

    // Defines the precise boundaries of the test run (including beforeEach and afterEach blocks);
    // this value comes from annotation data and so is only available for Cypress tests (for now)
    timeStampedPointRange: TimeStampedPointRange | null;
  }

  export type UserActionEventStack = Array<{
    columnNumber: number;
    fileName: string;
    functionName?: string;
    lineNumber: number;
  }>;

  export interface UserActionEvent {
    data: {
      category: "assertion" | "command" | "other";

      command: {
        arguments: string[];
        name: string;
      };

      // An error that occurred while executing this action (if any)
      error: TestError | null;

      // Used to associate related annotations
      id: string;

      // Used to associate chained commands
      parentId: string | null;

      testRunnerName: TestRunnerName;

      // This value comes from annotations and so is only available for Cypress tests (for now)
      resultVariable: string | null;

      // If an action is somewhere other than the main test body;
      // for example, before/after actions have different scopes
      scope: string[] | null;

      // Playwright only
      testSourceCallStack: UserActionEventStack | null;

      // These values come from annotations and so is only available for Cypress tests (for now)
      timeStampedPoints: {
        // The time/point range during which the step was executed
        afterStep: TimeStampedPoint | null;
        beforeStep: TimeStampedPoint | null;

        // Used when evaluating the result of an assertion
        result: TimeStampedPoint | null;

        // Jump to source for the step
        viewSource: TimeStampedPoint | null;
      };
    };

    type: "user-action";
  }

  export interface NavigationEvent {
    // Data needed to render this event
    data: {
      url: string;
    };

    // The precise time this event occurred; not that events have no duration
    timeStampedPoint: TimeStampedPoint;

    type: "navigation";
  }

  export interface NetworkRequestEvent {
    // Data needed to render this event
    data: {
      request: {
        id: RequestId;
        method: string;
        url: string;
      };
      response: {
        status: number;
      } | null;
    };

    // The precise time this event occurred; not that events have no duration
    timeStampedPoint: TimeStampedPoint;

    type: "network-request";
  }

  export type TestEvent = UserActionEvent | NavigationEvent | NetworkRequestEvent;

  export type TestError = {
    name: string;
    message: string;
  };
}

// Export the union version of types (for type checker functions)
export type AnyGroupedTestCases =
  | RecordingTestMetadataV1.GroupedTestCases
  | RecordingTestMetadataV2.GroupedTestCases
  | RecordingTestMetadataV3.GroupedTestCases;
export type AnyTestRecording =
  | RecordingTestMetadataV1.TestRecording
  | RecordingTestMetadataV2.TestRecording
  | RecordingTestMetadataV3.TestRecording;

// Export the latest version of types (for convenience)
export type GroupedTestCases = RecordingTestMetadataV3.GroupedTestCases;
export type TestEnvironmentError = RecordingTestMetadataV3.TestEnvironmentError;
export type NavigationEvent = RecordingTestMetadataV3.NavigationEvent;
export type NetworkRequestEvent = RecordingTestMetadataV3.NetworkRequestEvent;
export type TestError = RecordingTestMetadataV3.TestError;
export type TestEvent = RecordingTestMetadataV3.TestEvent;
export type TestRecording = RecordingTestMetadataV3.TestRecording;
export type TestSectionName = RecordingTestMetadataV3.TestSectionName;
export type UserActionEvent = RecordingTestMetadataV3.UserActionEvent;
export type UserActionEventStack = RecordingTestMetadataV3.UserActionEventStack;

export async function processCypressTestRecording(
  testRecording: RecordingTestMetadataV2.TestRecording | RecordingTestMetadataV3.TestRecording,
  annotations: Annotation[],
  replayClient: ReplayClientInterface
): Promise<RecordingTestMetadataV3.TestRecording> {
  if (isTestRecordingV2(testRecording)) {
    const { attempt, error, events: partialEvents, id, result, source } = testRecording;

    const events: RecordingTestMetadataV3.TestRecording["events"] = {
      afterAll: [],
      afterEach: [],
      beforeAll: [],
      beforeEach: [],
      main: [],
    };

    let testBeginPoint: TimeStampedPoint | null = null;
    let testEndPoint: TimeStampedPoint | null = null;

    const navigationEvents: RecordingTestMetadataV3.NavigationEvent[] = [];

    // Skipped tests won't contain any annotations (include begin/end point)
    switch (result) {
      case "skipped":
      case "unknown": {
        break;
      }
      default: {
        // Note that event annotations may be interleaved,
        // meaning that we can't step through both arrays in one pass.
        // Instead we have to loop over the annotations array once to group data by event id–
        // (and also find the navigation and test start/end annotations)–
        // then we can iterate over the user-action events.
        const userActionEventIdToAnnotations: Record<string, Annotation[]> = {};

        for (let index = 0; index < annotations.length; index++) {
          const annotation = annotations[index];

          // TODO [SCS-1177] test:start and test:end annotations are unreliable
          // so we find start and end points based on the first and last events for a given test
          if (!testBeginPoint || comparePoints(testBeginPoint.point, annotation.point) > 0) {
            testBeginPoint = {
              point: annotation.point,
              time: annotation.time,
            };
          }

          if (!testEndPoint || comparePoints(testEndPoint.point, annotation.point) < 0) {
            testEndPoint = {
              point: annotation.point,
              time: annotation.time,
            };
          }

          switch (annotation.message.event) {
            case "event:navigation": {
              assert(annotation.message.url, "Navigation annotation must have a URL");

              const navigationEvent: RecordingTestMetadataV3.NavigationEvent = {
                data: {
                  url: annotation.message.url,
                },
                timeStampedPoint: {
                  point: annotation.point,
                  time: annotation.time,
                },
                type: "navigation",
              };

              navigationEvents.push(navigationEvent);
              break;
            }
            case "test:end":
            case "test:start": {
              break;
            }
            case "step:end":
            case "step:enqueue":
            case "step:start": {
              const id = annotation.message.id;
              assert(id != null, "Annotation event must have an id");
              if (userActionEventIdToAnnotations[id] == null) {
                userActionEventIdToAnnotations[id] = [annotation];
              } else {
                userActionEventIdToAnnotations[id].push(annotation);
              }
              break;
            }
            default: {
              console.warn(`Unexpected annotation type: ${annotation.message.event}`);
            }
          }
        }

        assert(testBeginPoint !== null, "Test must have a begin point");
        assert(testEndPoint !== null, "Test must have a end point");

        for (let sectionName in partialEvents) {
          // TODO [SCS-1186] Ignore beforeAll/afterAll sections for now;
          // We'll need to make some changes to both Devtools UI and the Replay plug-in to handle these
          switch (sectionName) {
            case "afterAll":
            case "beforeAll":
              continue;
          }

          const testEvents = events[sectionName as RecordingTestMetadataV3.TestSectionName];

          const partialTestEvents =
            partialEvents[sectionName as RecordingTestMetadataV3.TestSectionName];
          partialTestEvents.forEach(partialTestEvent => {
            const {
              category,
              command,
              error = null,
              id,
              parentId = null,
              scope = null,
            } = partialTestEvent.data;

            assert(category, `Test event must have "category" property`, {
              command: command.name,
              id,
            });

            assert(command, `Test event must have "command" property`, {
              id,
              category,
            });

            assert(id, `Test event must have "id" property`, {
              command: command.name,
              category,
            });

            // The client does not show certain types of chained events in the list
            // they clutter without adding much value
            if (parentId !== null) {
              switch (command.name) {
                case "as":
                case "then":
                  return null;
              }
            }

            const annotations = userActionEventIdToAnnotations[id];

            assert(annotations != null, `Missing annotations for test event`, {
              command: command.name,
              id,
            });

            let resultPoint: TimeStampedPoint | null = null;
            let resultVariable: string | null = null;
            let stepStartPoint: TimeStampedPoint | null = null;
            let stepEnqueuePoint: TimeStampedPoint | null = null;
            let stepEndPoint: TimeStampedPoint | null = null;
            let viewSourcePoint: TimeStampedPoint | null = null;

            const isChaiAssertion = command.name === "assert";
            // TODO [FE-1419] name === "assert" && !annotations.enqueue;

            annotations.forEach(annotation => {
              switch (annotation.message.event) {
                case "step:end": {
                  stepEndPoint = {
                    point: annotation.point,
                    time: annotation.time,
                  };

                  resultVariable = annotation.message.logVariable ?? null;

                  if (resultVariable) {
                    // Cypress commands have a `resultVariable` field that we need to find the
                    // right step details object at the given `result` point.
                    resultPoint = {
                      point: annotation.point,
                      time: annotation.time,
                    };
                  }
                  break;
                }
                case "step:enqueue": {
                  stepEnqueuePoint = {
                    point: annotation.point,
                    time: annotation.time,
                  };

                  if (!isChaiAssertion) {
                    viewSourcePoint = {
                      point: annotation.point,
                      time: annotation.time,
                    };
                  }
                  break;
                }
                case "step:start": {
                  stepStartPoint = {
                    point: annotation.point,
                    time: annotation.time,
                  };

                  if (isChaiAssertion) {
                    viewSourcePoint = {
                      point: annotation.point,
                      time: annotation.time,
                    };
                  }
                  break;
                }
              }
            });

            assert(stepStartPoint !== null, `Missing "step:start" annotation for test event`, {
              id,
            });
            assert(viewSourcePoint !== null, `Missing annotation for test event`, {
              annotationType: isChaiAssertion ? "step:start" : "step:enqueue",
              id,
              isChaiAssertion,
            });

            testEvents.push({
              data: {
                category,
                command,
                error,
                id,
                parentId,
                testRunnerName: "cypress",
                resultVariable,
                scope,
                testSourceCallStack: null,
                timeStampedPoints: {
                  afterStep: stepEndPoint,
                  beforeStep: command.name === "get" ? stepEndPoint : stepStartPoint,
                  result: resultPoint,
                  viewSource: viewSourcePoint,
                },
              },
              type: "user-action",
            });
          });
        }

        // Finds the section that contains a given point
        // defaults to the main (test body) section if no matches found
        const findSection = (point: ExecutionPoint) => {
          const sections = Object.values(events);
          for (let index = sections.length - 1; index >= 0; index--) {
            const events = sections[index];
            const firstEvent = events[0];
            if (firstEvent && comparePoints(getTestEventExecutionPoint(firstEvent)!, point) <= 0) {
              return events;
            }
          }
          return events.main;
        };

        const networkRequestEvents = await processNetworkData(
          replayClient,
          testBeginPoint,
          testEndPoint
        );
        // Now that section boundaries have been defined by user-actions,
        // merge in navigation and network events.
        navigationEvents.forEach(navigationEvent => {
          const events = findSection(navigationEvent.timeStampedPoint.point);
          insert(events, navigationEvent, compareTestEventExecutionPoints);
        });
        networkRequestEvents.forEach(networkRequestEvent => {
          const events = findSection(networkRequestEvent.timeStampedPoint.point);
          insert(events, networkRequestEvent, compareTestEventExecutionPoints);
        });
      }
    }

    return {
      attempt,
      error,
      testRunnerName: "cypress",
      events,
      id,
      result,
      source,
      timeStampedPointRange:
        testBeginPoint && testEndPoint
          ? {
              begin: testBeginPoint,
              end: testEndPoint,
            }
          : null,
    };
  } else if (isTestRecordingV3(testRecording)) {
    return testRecording;
  } else {
    // This function does not support the legacy TestItem format
    throw Error(`Unsupported legacy TestItem value`);
  }
}

export async function processGroupedTestCases(
  replayClient: ReplayClientInterface,
  groupedTestCases:
    | RecordingTestMetadataV2.GroupedTestCases
    | RecordingTestMetadataV3.GroupedTestCases,
  testSources: PlaywrightTestSources | null,
  testStacks: PlaywrightTestStacks | null
): Promise<RecordingTestMetadataV3.GroupedTestCases> {
  if (isGroupedTestCasesV3(groupedTestCases)) {
    return groupedTestCases;
  } else if (isGroupedTestCasesV2(groupedTestCases)) {
    const { environment, run, source, tests: partialTestRecordings, ...rest } = groupedTestCases;
    switch (environment.testRunner.name) {
      case "cypress": {
        const annotations = await AnnotationsCache.readAsync(replayClient);

        if (detectMissingCypressPlugin(annotations, partialTestRecordings)) {
          recordData("process-test-metadata", { message: "missing-cypress-plugin" });
          const testRecordings: RecordingTestMetadataV3.TestRecording[] = [];
          for (let index = 0; index < partialTestRecordings.length; index++) {
            const legacyTest = partialTestRecordings[index];
            const test = await processCypressTestRecording(
              {
                ...legacyTest,
                result: "unknown",
              },
              [],
              replayClient
            );

            testRecordings.push(test);
          }

          return {
            ...rest,
            runId: run.id,
            environment: {
              ...environment,
              errors: [
                {
                  code: 0,
                  detail: null,
                  message: "Missing or bad plug-in configuration.",
                  name: "MissingCypressPluginError",
                },
                ...environment.errors,
              ],
            },
            source: {
              filePath: source.path,
              title: source.title,
            },
            testRecordings,
            testSources: null,
          };
        } else {
          // Annotations for the entire recording (which may include more than one test)
          // we need to splice only the appropriate subset for each test.
          const annotationsByTest: Annotation[][] = annotations.reduce(
            (accumulated: Annotation[][], annotation: Annotation) => {
              const { testId, attempt } = annotation.message;

              if (testId == null) {
                // beforeAll/afterAll have a null testId (for > 1.0.6) and can
                // be ignored for now
                return accumulated;
              }

              assert(attempt != null, "Annotation is missing `attempt`. Plugin update required.");

              const index = partialTestRecordings.findIndex(
                t => t.id === testId && t.attempt === attempt
              );
              assert(index !== -1, "Unable to find test for annotation", { annotation });
              accumulated[index] = accumulated[index] || [];
              accumulated[index].push(annotation);

              return accumulated;
            },
            []
          );

          // GroupedTestCasesV2 and GroupedTestCases types are the same,
          // except for annotation data inside of their recorded tests
          let testRecordings: RecordingTestMetadataV3.TestRecording[] = [];
          for (let index = 0; index < partialTestRecordings.length; index++) {
            const legacyTest = partialTestRecordings[index];
            const annotations = annotationsByTest[index];
            const test = await processCypressTestRecording(legacyTest, annotations, replayClient);

            testRecordings.push(test);
          }

          return {
            ...rest,
            environment,
            runId: run.id,
            source: {
              filePath: source.path,
              title: source.title,
            },
            testRecordings,
            testSources: null,
          };
        }
      }
      case "playwright": {
        const annotations = await PlaywrightAnnotationsCache.readAsync(replayClient);
        let testRecordings: RecordingTestMetadataV3.TestRecording[] = [];
        for (let index = 0; index < partialTestRecordings.length; index++) {
          const legacyTest = partialTestRecordings[index];
          const test = await processPlaywrightTestRecording(legacyTest, annotations, testStacks);

          testRecordings.push(test);
        }

        return {
          ...rest,
          environment,
          runId: run.id,
          source: {
            filePath: source.path,
            title: source.title,
          },
          testRecordings,
          testSources,
        };
      }
      default: {
        throw Error(`Unsupported test runner: ${environment.testRunner.name}`);
      }
    }
  } else {
    // This function does not support the legacy (v1) metadata format
    throw Error(`Unsupported legacy data format`);
  }
}

export async function processPlaywrightTestRecording(
  testRecording: RecordingTestMetadataV2.TestRecording | RecordingTestMetadataV3.TestRecording,
  annotations: Annotation[],
  stacks: PlaywrightTestStacks | null
): Promise<RecordingTestMetadataV3.TestRecording> {
  if (isTestRecordingV2(testRecording)) {
    const { attempt, error, events: partialEvents, id, result, source } = testRecording;

    const events: RecordingTestMetadataV3.TestRecording["events"] = {
      afterAll: [],
      afterEach: [],
      beforeAll: [],
      beforeEach: [],
      main: [],
    };

    for (let sectionName in partialEvents) {
      // TODO [SCS-1186] Ignore beforeAll/afterAll sections for now;
      // We'll need to make some changes to both Devtools UI and the Replay plug-in to handle these
      switch (sectionName) {
        case "afterAll":
        case "beforeAll":
          continue;
      }

      const testEvents = events[sectionName as RecordingTestMetadataV3.TestSectionName];

      const partialTestEvents =
        partialEvents[sectionName as RecordingTestMetadataV3.TestSectionName];
      partialTestEvents.forEach(partialTestEvent => {
        const {
          category,
          command,
          error = null,
          id,
          parentId = null,
          scope = null,
        } = partialTestEvent.data;

        assert(category, `Test event must have "category" property`, {
          command: command?.name,
          id,
        });
        assert(command, `Test event must have "command" property`, {
          category,
          id,
        });
        assert(id, `Test event must have "id" property`, {
          command: command?.name,
          category,
        });

        // The client does not show certain types of chained events in the list
        // they clutter without adding much value
        if (parentId !== null) {
          switch (command.name) {
            case "as":
            case "then":
              return null;
          }
        }

        const stack = stacks?.[id];

        let startAnnotation = annotations.find(
          annotation => annotation.message.event === "step:start" && annotation.message.id === id
        );
        let endAnnotation = annotations.find(
          annotation => annotation.message.event === "step:end" && annotation.message.id === id
        );
        let timeStampedPointRange = null;
        if (startAnnotation || endAnnotation) {
          startAnnotation = startAnnotation ?? endAnnotation!;
          endAnnotation = endAnnotation ?? startAnnotation!;
          timeStampedPointRange = {
            begin: { point: startAnnotation.point, time: startAnnotation.time },
            end: { point: endAnnotation.point, time: endAnnotation.time },
          };
        }

        let afterStep: TimeStampedPoint | null = timeStampedPointRange?.end ?? null;
        let beforeStep: TimeStampedPoint | null = timeStampedPointRange?.begin ?? null;
        let resultPoint: TimeStampedPoint | null = null;

        if (category === "command" && beforeStep) {
          // Playwright commands have a "command" category. We'll only look for
          // steps that have a `locator.something()` command and a locator string arg.
          if (
            command.name.startsWith("locator") &&
            command.arguments.length > 0 &&
            command.arguments[0].length > 0
          ) {
            resultPoint = beforeStep;
          }
        }

        testEvents.push({
          data: {
            category,
            command,
            error,
            id,
            parentId,
            testRunnerName: "playwright",
            resultVariable: null,
            scope,
            testSourceCallStack: stack
              ? stack.map(frame => ({
                  columnNumber: frame.column,
                  fileName: frame.file,
                  functionName: frame.functionName,
                  lineNumber: frame.line,
                }))
              : null,
            timeStampedPoints: {
              afterStep,
              beforeStep,
              result: resultPoint,
              viewSource: null,
            },
          },
          type: "user-action",
        });
      });
    }

    return {
      attempt,
      error,
      testRunnerName: "playwright",
      events,
      id,
      result,
      source,
      timeStampedPointRange: null,
    };
  } else if (isTestRecordingV3(testRecording)) {
    return testRecording;
  } else {
    // This function does not support the legacy TestItem format
    throw Error(`Unsupported legacy TestItem value`);
  }
}

export function getPlaywrightTestTimeStampedPointRange(
  events: RecordingTestMetadataV3.TestRecording["events"]
) {
  const allEventsSections = Object.values(events);
  let testBeginPoint: TimeStampedPoint | null = null;
  let testEndPoint: TimeStampedPoint | null = null;
  for (const events of allEventsSections) {
    for (const event of events) {
      const executionPoint = getTestEventExecutionPoint(event);
      if (executionPoint) {
        if (!testBeginPoint || comparePoints(testBeginPoint.point, executionPoint) > 0) {
          testBeginPoint = {
            point: executionPoint,
            time: getTestEventTime(event)!,
          };
        }

        if (!testEndPoint || comparePoints(testEndPoint.point, executionPoint) < 0) {
          testEndPoint = {
            point: executionPoint,
            time: getTestEventTime(event)!,
          };
        }
      }
    }
  }

  if (testBeginPoint && testEndPoint) {
    return {
      begin: testBeginPoint,
      end: testEndPoint,
    };
  }
  return null;
}

// If there are test(s) with completed status (passed/failed/timedOut) but no annotations,
// that indicates that the Cypress support plugin file wasn't included.
// The frontend is in a better position to detect this scenario than the plug-in,
// so we should add an environment error in.
//
// See FE-1645
function detectMissingCypressPlugin(
  annotations: Annotation[],
  partialTestRecordings: RecordingTestMetadataV2.TestRecording[]
): boolean {
  if (annotations.length === 0) {
    const hasIncompleteTest = partialTestRecordings.some(test => {
      switch (test.result) {
        case "failed":
        case "passed":
        case "timedOut":
          break;
        default:
          return true;
      }
    });

    return !hasIncompleteTest;
  }

  return false;
}

async function processNetworkData(
  replayClient: ReplayClientInterface,
  begin: TimeStampedPoint,
  end: TimeStampedPoint
): Promise<RecordingTestMetadataV3.NetworkRequestEvent[]> {
  const stream = networkRequestsCache.stream(replayClient);
  await stream.resolver;
  const records = stream.data!;
  const ids = stream.value!;

  // Filter by RequestInfo (because they have execution points)
  // then map RequestInfo to RequestEventInfo using ids
  const beginIndex = binarySearch(0, ids.length, index => {
    const currentItem = records[ids[index]];
    return comparePoints(begin.point, currentItem.timeStampedPoint.point);
  });
  let endIndex = binarySearch(beginIndex, ids.length, index => {
    const currentItem = records[ids[index]];
    return comparePoints(end.point, currentItem.timeStampedPoint.point);
  });
  if (comparePoints(end.point, records[ids[endIndex]].timeStampedPoint.point) >= 0) {
    endIndex++;
  }

  const networkRequestEvents: RecordingTestMetadataV3.NetworkRequestEvent[] = [];

  for (let index = beginIndex; index < endIndex; index++) {
    const id = ids[index];

    const { events, timeStampedPoint } = records[id];

    assert(events.openEvent != null, `Missing RequestOpenEvent for network request`, {
      id,
    });

    switch (events.openEvent.requestCause) {
      case "fetch":
      case "xhr":
        break;
      default:
        continue;
    }

    networkRequestEvents.push({
      data: {
        request: {
          id,
          method: events.openEvent.requestMethod,
          url: events.openEvent.requestUrl,
        },
        response: events.responseEvent
          ? {
              status: events.responseEvent.responseStatus,
            }
          : null,
      },
      timeStampedPoint,
      type: "network-request",
    });
  }

  return networkRequestEvents;
}

export function getGroupedTestCasesFilePath(groupedTestCases: AnyGroupedTestCases): string | null {
  if (isGroupedTestCasesV1(groupedTestCases)) {
    return groupedTestCases.file ?? null;
  } else if (isGroupedTestCasesV2(groupedTestCases)) {
    return groupedTestCases.source.path;
  } else {
    return groupedTestCases.source.filePath;
  }
}

export function getGroupedTestCasesTitle(groupedTestCases: AnyGroupedTestCases): string | null {
  if (isGroupedTestCasesV1(groupedTestCases)) {
    return groupedTestCases.title;
  } else {
    return groupedTestCases.source.title;
  }
}

export function getTestEventTimeStampedPoint(
  testEvent: RecordingTestMetadataV3.TestEvent
): TimeStampedPoint | null {
  if (isNavigationTestEvent(testEvent) || isNetworkRequestTestEvent(testEvent)) {
    return testEvent.timeStampedPoint;
  } else {
    return testEvent.data.timeStampedPoints.beforeStep ?? null;
  }
}

export function getTestEventExecutionPoint(
  testEvent: RecordingTestMetadataV3.TestEvent
): ExecutionPoint | null {
  return getTestEventTimeStampedPoint(testEvent)?.point ?? null;
}

export function getTestEventTime(testEvent: RecordingTestMetadataV3.TestEvent): number | null {
  return getTestEventTimeStampedPoint(testEvent)?.time ?? null;
}

export function getUserActionEventRange(
  userActionEvent: RecordingTestMetadataV3.UserActionEvent
): TimeStampedPointRange {
  const { afterStep, beforeStep, result, viewSource } = userActionEvent.data.timeStampedPoints;
  return {
    begin: minTimeStampedPoint([afterStep, beforeStep, result, viewSource])!,
    end: maxTimeStampedPoint([afterStep, beforeStep, result, viewSource])!,
  };
}

export function isGroupedTestCasesV1(
  value: AnyGroupedTestCases
): value is RecordingTestMetadataV1.GroupedTestCases {
  const version = (value as any).version;
  return version != null && version === 1;
}

export function isGroupedTestCasesV2(
  value: AnyGroupedTestCases
): value is RecordingTestMetadataV2.GroupedTestCases {
  const schemaVersion = (value as any).schemaVersion;
  return schemaVersion != null && satisfies(schemaVersion, "^2.0.0");
}

export function isGroupedTestCasesV3(
  value: AnyGroupedTestCases
): value is RecordingTestMetadataV3.GroupedTestCases {
  const schemaVersion = (value as any).schemaVersion;
  return schemaVersion != null && satisfies(schemaVersion, "^3.0.0");
}

export function isNavigationTestEvent(
  value: TestEvent
): value is RecordingTestMetadataV3.NavigationEvent {
  return value.type === "navigation";
}

export function isNetworkRequestTestEvent(
  value: TestEvent
): value is RecordingTestMetadataV3.NetworkRequestEvent {
  return value.type === "network-request";
}

export function isTestRecordingV1(
  value: AnyTestRecording
): value is RecordingTestMetadataV1.TestRecording {
  return "steps" in value;
}

export function isTestRecordingV2(
  value: AnyTestRecording
): value is RecordingTestMetadataV2.TestRecording {
  // TimeStampedPointRange comes from annotations data;
  // if this is missing, the client needs to manually merge
  return !("type" in value);
}

export function isTestRecordingV3(
  value: AnyTestRecording
): value is RecordingTestMetadataV3.TestRecording {
  // TimeStampedPointRange comes from annotations data;
  // if this is missing, the client needs to manually merge
  return "timeStampedPointRange" in value;
}

export function isUserActionTestEvent(
  value: TestEvent
): value is RecordingTestMetadataV3.UserActionEvent {
  return value.type === "user-action";
}

export function isUserClickEvent(event: TestEvent) {
  if (isUserActionTestEvent(event)) {
    const { category, command, testRunnerName } = event.data;
    if (category !== "command") {
      return false;
    }

    switch (testRunnerName) {
      case "cypress": {
        return ["click", "check", "uncheck"].includes(command.name);
      }
      case "playwright": {
        return ["locator.click", "locator.check", "locator.uncheck"].some(name =>
          command.name.startsWith(name)
        );
      }
    }
  }

  return false;
}

export function isUserKeyboardEvent(event: TestEvent) {
  if (isUserActionTestEvent(event)) {
    const { category, command, testRunnerName } = event.data;
    if (category !== "command") {
      return false;
    }

    switch (testRunnerName) {
      case "cypress": {
        return ["type"].includes(command.name);
      }
      case "playwright": {
        return ["locator.type", "keyboard.down", "keyboard.press", "keyboard.type"].some(name =>
          command.name.startsWith(name)
        );
      }
    }
  }

  return false;
}

export function compareTestEventExecutionPoints(
  a: RecordingTestMetadataV3.TestEvent,
  b: RecordingTestMetadataV3.TestEvent
): number {
  const executionPointA = getTestEventExecutionPoint(a);
  const executionPointB = getTestEventExecutionPoint(b);

  // These comparisons should never actually be needed;
  // Playwright events will always have null timestamped points
  // and Cypress tests will always have timestamped points
  if (executionPointA === null && executionPointB === null) {
    return 0;
  } else if (executionPointA === null) {
    return 1;
  } else if (executionPointB === null) {
    return -1;
  } else {
    return comparePoints(executionPointA, executionPointB);
  }
}

export type TestEnvironment = RecordingTestMetadataV3.GroupedTestCases["environment"];

export function getTestEnvironment(groupedTestCases: AnyGroupedTestCases): TestEnvironment | null {
  if (isGroupedTestCasesV1(groupedTestCases)) {
    return null;
  }
  return groupedTestCases.environment;
}

export function getTestRunId(groupedTestCases: AnyGroupedTestCases): string | null {
  if (isGroupedTestCasesV1(groupedTestCases)) {
    return null;
  } else if (isGroupedTestCasesV2(groupedTestCases)) {
    return groupedTestCases.run.id;
  } else {
    return groupedTestCases.runId;
  }
}
