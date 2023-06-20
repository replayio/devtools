import assert from "assert";
import {
  ExecutionPoint,
  RequestId,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import { satisfies } from "compare-versions";

import { comparePoints } from "protocol/execution-point-utils";
import { networkRequestsCache } from "replay-next/src/suspense/NetworkRequestsCache";
import { findSliceIndices, insert } from "replay-next/src/utils/array";
import { ReplayClientInterface } from "shared/client/types";
import { Annotation } from "shared/graphql/types";
import { AnnotationsCache } from "ui/components/TestSuite/suspense/AnnotationsCache";

export type SemVer = string;

// This type is only minimally supported by the frontend
export namespace RecordingTestMetadataV1 {
  export type GroupedTestCases = {
    file?: string;
    path?: string[];
    result: RecordingTestMetadataV3.TestResult;
    run?: { id: string; title?: string };
    runner?: { name: string; version: string; plugin: string };
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
    "source" | "testRecordings"
  > & {
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
        name: string;
        version: SemVer;
      };
    };

    // High level summary of tests within this recording
    // based on same data as contained in the resultCounts map below
    result: TestResult;

    // Summarizes result of the test run
    resultCounts: Record<TestResult, number>;

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
  }

  export interface TestRecording {
    // An error that occurred for this test that was unrelated to a specific event
    // e.g. a JS runtime error in the cypress spec file
    error: TestError | null;

    // Actions that were part of this test, grouped by section (or "hook")
    events: Record<TestSectionName, TestEvent[]>;

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

      // This value comes from annotations and so is only avaiable for Cypress tests (for now)
      result: {
        timeStampedPoint: TimeStampedPoint;
        variable: string;
      } | null;

      // If an action is somewhere other than the main test body;
      // for example, before/after actions have different scopes
      scope: string[] | null;

      // This value comes from annotations and so is only avaiable for Cypress tests (for now)
      viewSourceTimeStampedPoint: TimeStampedPoint | null;
    };

    // Precisely defines the start/stop execution points (and times) for the action
    // This value comes from annotations and so is only avaiable for Cypress tests (for now)
    timeStampedPointRange: TimeStampedPointRange;

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

export async function processCypressTestRecording(
  testRecording: RecordingTestMetadataV2.TestRecording | RecordingTestMetadataV3.TestRecording,
  annotations: Annotation[],
  replayClient: ReplayClientInterface
): Promise<RecordingTestMetadataV3.TestRecording> {
  if (isTestRecordingV2(testRecording)) {
    const { error, events: partialEvents, result, source } = testRecording;

    const events: RecordingTestMetadataV3.TestRecording["events"] = {
      afterAll: [],
      afterEach: [],
      beforeAll: [],
      beforeEach: [],
      main: [],
    };

    let beginPoint: TimeStampedPoint | null = null;
    let endPoint: TimeStampedPoint | null = null;

    const navigationEvents: RecordingTestMetadataV3.NavigationEvent[] = [];

    // Skipped tests won't contain any annotations (include begin/end point)
    if (result !== "skipped") {
      // Note that event annotations may be interleaved,
      // meaning that we can't step through both arrays in one pass.
      // Instead we have to loop over the annotations array once to group data by event id–
      // (and also find the navigation and test start/end annotations)–
      // then we can iterate over the user-action events.
      const userActionEventIdToAnnotations: Record<string, Annotation[]> = {};

      for (let index = 0; index < annotations.length; index++) {
        const annotation = annotations[index];
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
          case "test:start": {
            beginPoint = {
              point: annotation.point,
              time: annotation.time,
            };
            break;
          }
          case "test:end": {
            endPoint = {
              point: annotation.point,
              time: annotation.time,
            };
            break;
          }
          default: {
            console.warn(`Unexpected annotation type: ${annotation.message.event}`);
          }
        }
      }

      assert(beginPoint !== null, "Test must have a begin point");
      assert(endPoint !== null, "Test must have a end point");

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

          assert(category, `Test event must have "category" property`);
          assert(command, `Test event must have "command" property`);
          assert(id, `Test event must have "id" property`);

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

          assert(annotations != null, `Missing annotations for test event (${command.name})`);

          let beginPoint: TimeStampedPoint | null = null;
          let endPoint: TimeStampedPoint | null = null;
          let resultPoint: TimeStampedPoint | null = null;
          let resultVariable: string | null = null;
          let viewSourceTimeStampedPoint: TimeStampedPoint | null = null;

          const isChaiAssertion = command.name === "assert";
          // TODO [FE-1419] name === "assert" && !annotations.enqueue;

          annotations.forEach(annotation => {
            switch (annotation.message.event) {
              case "step:end": {
                endPoint = {
                  point: annotation.point,
                  time: annotation.time,
                };

                resultPoint = {
                  point: annotation.point,
                  time: annotation.time,
                };
                resultVariable = annotation.message.logVariable ?? null;
                break;
              }
              case "step:enqueue": {
                if (!isChaiAssertion) {
                  viewSourceTimeStampedPoint = {
                    point: annotation.point,
                    time: annotation.time,
                  };
                }
                break;
              }
              case "step:start": {
                beginPoint = {
                  point: annotation.point,
                  time: annotation.time,
                };

                if (isChaiAssertion) {
                  viewSourceTimeStampedPoint = {
                    point: annotation.point,
                    time: annotation.time,
                  };
                }
                break;
              }
            }
          });

          assert(beginPoint !== null, `Missing "step:start" annotation for test event ${id}`);
          assert(
            viewSourceTimeStampedPoint !== null,
            `Missing ${
              isChaiAssertion ? "step:start" : "step:enqueue"
            } annotation for test event ${id}`
          );

          testEvents.push({
            data: {
              category: category,
              command: {
                arguments: command.arguments,
                name: command.name,
              },
              error,
              id,
              parentId,
              result:
                resultVariable && resultPoint
                  ? {
                      timeStampedPoint: resultPoint,
                      variable: resultVariable,
                    }
                  : null,
              scope,
              viewSourceTimeStampedPoint,
            },
            timeStampedPointRange: {
              begin: beginPoint,
              end: endPoint || beginPoint,
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

      const networkRequestEvents = await processNetworkData(replayClient, beginPoint, endPoint);
      // Now that section boundaries have been defined by user-actions,
      // merge in navigation and network events.
      navigationEvents.forEach(navigationEvent => {
        const events = findSection(navigationEvent.timeStampedPoint.point);
        insert(events, navigationEvent, (a, b) =>
          comparePoints(getTestEventExecutionPoint(a), getTestEventExecutionPoint(b))
        );
      });
      networkRequestEvents.forEach(networkRequestEvent => {
        const events = findSection(networkRequestEvent.timeStampedPoint.point);
        insert(events, networkRequestEvent, (a, b) =>
          comparePoints(getTestEventExecutionPoint(a), getTestEventExecutionPoint(b))
        );
      });
    }

    return {
      error,
      events,
      result,
      source,
      timeStampedPointRange:
        beginPoint && endPoint
          ? {
              begin: beginPoint,
              end: endPoint,
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
  groupedTestCases:
    | RecordingTestMetadataV2.GroupedTestCases
    | RecordingTestMetadataV3.GroupedTestCases,
  replayClient: ReplayClientInterface
): Promise<RecordingTestMetadataV3.GroupedTestCases> {
  if (isGroupedTestCasesV3(groupedTestCases)) {
    return groupedTestCases;
  } else if (isGroupedTestCasesV2(groupedTestCases)) {
    const { environment, source, tests: partialTestRecordings, ...rest } = groupedTestCases;
    switch (environment.testRunner.name) {
      case "cypress": {
        const annotations = await AnnotationsCache.readAsync(replayClient);

        let currentTestAnnotations: Annotation[] | null = null;
        let currentTestRecording: AnyTestRecording | null = null;
        let currentTestRecordingIndex = -1;
        let currentTestHasEnded = true;

        // Annotations for the entire recording (which may include more than one test)
        // we need to splice only the appropriate subset for each test.
        const annotationsByTest: Annotation[][] = annotations.reduce(
          (accumulated: Annotation[][], annotation: Annotation) => {
            eventSwitch: switch (annotation.message.event) {
              case "step:enqueue":
              case "step:start": {
                if (currentTestHasEnded) {
                  // TODO [SCS-1186]
                  // Ignore steps that start outside of a test boundary;
                  // These likely correspond to beforeAll or afterAll hooks which we filter for now
                  return accumulated;
                }
                break;
              }
              case "test:start": {
                // Tests that were skipped won't have annotations.
                // Add empty annotations arrays for these.
                if (currentTestHasEnded) {
                  while (currentTestRecordingIndex < partialTestRecordings.length - 1) {
                    currentTestRecordingIndex++;
                    currentTestRecording = partialTestRecordings[currentTestRecordingIndex];

                    currentTestAnnotations = [];
                    currentTestHasEnded = false;

                    accumulated.push(currentTestAnnotations);

                    if (currentTestRecording.result !== "skipped") {
                      break eventSwitch;
                    }
                  }
                }
                break;
              }
              case "test:end": {
                currentTestHasEnded = true;
                break;
              }
            }

            // Ignore annotations that happen before the first test
            // (These are probably beforeAll annotations, which we don't fully support yet)
            if (currentTestAnnotations) {
              currentTestAnnotations.push(annotation);
            }

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
          source: {
            filePath: source.path,
            title: source.title,
          },
          testRecordings,
        };
      }
      case "playwright": {
        let testRecordings: RecordingTestMetadataV3.TestRecording[] = [];
        for (let index = 0; index < partialTestRecordings.length; index++) {
          const legacyTest = partialTestRecordings[index];
          const test = await processPlaywrightTestRecording(legacyTest);

          testRecordings.push(test);
        }

        return {
          ...rest,
          environment,
          source: {
            filePath: source.path,
            title: source.title,
          },
          testRecordings,
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
  testRecording: RecordingTestMetadataV2.TestRecording | RecordingTestMetadataV3.TestRecording
): Promise<RecordingTestMetadataV3.TestRecording> {
  if (isTestRecordingV2(testRecording)) {
    const { error, events: partialEvents, result, source } = testRecording;

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

        assert(category, `Test event must have "category" property`);
        assert(command, `Test event must have "command" property`);
        assert(id, `Test event must have "id" property`);

        // The client does not show certain types of chained events in the list
        // they clutter without adding much value
        if (parentId !== null) {
          switch (command.name) {
            case "as":
            case "then":
              return null;
          }
        }

        testEvents.push({
          data: {
            category: category,
            command: {
              arguments: command.arguments,
              name: command.name,
            },
            error,
            id,
            parentId,
            result: null,
            scope,
            viewSourceTimeStampedPoint: null,
          },
          // HACK
          // This will be filled in below;
          // There are asserts to ensure it
          timeStampedPointRange: null as any,
          type: "user-action",
        });
      });
    }

    return {
      error,
      events,
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
  const [beginIndex, endIndex] = findSliceIndices(ids, begin.point, end.point, (id, point) => {
    const requestData = records[id];
    return comparePoints(requestData.timeStampedPoint.point, point);
  });

  if (beginIndex < 0 || endIndex < 0) {
    return [];
  }

  return ids.slice(beginIndex, endIndex).map(id => {
    const { events, timeStampedPoint } = records[id];

    assert(events.openEvent != null, `Missing RequestOpenEvent for network request ${id}`);

    return {
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
    };
  });
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

export function getTestEventExecutionPoint(
  testEvent: RecordingTestMetadataV3.TestEvent
): ExecutionPoint {
  if (isNavigationTestEvent(testEvent) || isNetworkRequestTestEvent(testEvent)) {
    return testEvent.timeStampedPoint.point;
  } else {
    return testEvent.timeStampedPointRange.begin.point;
  }
}

export function getTestEventTime(testEvent: RecordingTestMetadataV3.TestEvent): number | null {
  if (isNavigationTestEvent(testEvent) || isNetworkRequestTestEvent(testEvent)) {
    return testEvent.timeStampedPoint.time;
  } else {
    return testEvent.timeStampedPointRange ? testEvent.timeStampedPointRange.begin.time : null;
  }
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
  return schemaVersion != null && satisfies(schemaVersion, "~2.0.0");
}

export function isGroupedTestCasesV3(
  value: AnyGroupedTestCases
): value is RecordingTestMetadataV3.GroupedTestCases {
  const schemaVersion = (value as any).schemaVersion;
  return schemaVersion != null && satisfies(schemaVersion, "~3.0.0");
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
