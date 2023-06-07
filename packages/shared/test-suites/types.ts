import { ExecutionPoint, TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";
import { satisfies } from "compare-versions";

import { GetTestsRun_node_Workspace_testRuns } from "shared/graphql/generated/GetTestsRun";
import { GetTestsRunsForWorkspace_node_Workspace_testRuns } from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { LegacyTestMetadata, Recording } from "shared/graphql/types";

export type SemVer = string;

export type TestSuiteMode = "diagnostics" | "record-on-retry" | "stress";

export type TestSuiteBranchStatus = "closed" | "merged" | "open";

export type TestSuiteSourceMetadata = {
  branchName: string | null;
  branchStatus: TestSuiteBranchStatus;
  commitId: string;
  triggerUrl: string | null;
  user: string | null;
};

// A TestSuite is a group of tests that were run together
// Typically these are "triggered" by CI (e.g. GitHub Workflow)
export interface TestSuite {
  date: string;
  id: string;
  mode: TestSuiteMode | null;
  results: {
    counts: {
      failed: number;
      flaky: number;
      passed: number;
    };
    recordings: Recording[];
  };
  source: TestSuiteSourceMetadata | null;
  title: string;
}

export type TestResult = "failed" | "passed" | "skipped" | "timedOut" | "unknown";

export type TestSectionName = "afterAll" | "afterEach" | "beforeAll" | "beforeEach" | "main";

// Describes the outcome of running a test (file)
// as well as information about the test runner and environment
// If a test fails, it may be executed multiple times (e.g. retries);
// each of these attempts is tracked in the testRecordings array
export interface GroupedTestCases {
  // Safe to use for display on Library page
  // Not accurate enough to use for setting focus region in DevTools
  approximateDuration: number;

  // Environment that generated the test results
  environment: {
    // Plug-in/integration errors (e.g. missing steps, no steps, mismatched annotations)
    // Empty array means there were no errors
    errors: Array<{
      code: number;
      detail: string | null;
      name: string;
      message: string;
    }>;

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

// Describes an individual test:
// For Playwright this is a test() block
// For Cypress this is an it() block
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
  // this value comes from annotation data
  timeStampedPointRange: TimeStampedPointRange;
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

    result: {
      timeStampedPoint: TimeStampedPoint;
      variable: string;
    } | null;

    // If an action is somewhere other than the main test body;
    // for example, before/after actions have different scopes
    scope: string[] | null;

    viewSourceTimeStampedPoint: TimeStampedPoint;
  };

  // Precisely defines the start/stop execution points (and times) for the action
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

// Intermediate types the frontend supports temporarily (until backend data has finished migrating)

export type IncrementalTestRecording = Omit<TestRecording, "events" | "timeStampedPointRange"> & {
  events: {
    afterAll: IncrementalUserActionEvent[];
    afterEach: IncrementalUserActionEvent[];
    beforeAll: IncrementalUserActionEvent[];
    beforeEach: IncrementalUserActionEvent[];
    main: IncrementalUserActionEvent[];
  };
};

type IncrementalUserActionEvent = Omit<UserActionEvent, "data" | "timeStampedPointRange"> & {
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

export type IncrementalGroupedTestCases = Omit<GroupedTestCases, "testRecordings"> & {
  tests: IncrementalTestRecording[];
};

export type LegacyTestSuite =
  | GetTestsRun_node_Workspace_testRuns
  | GetTestsRunsForWorkspace_node_Workspace_testRuns;

// Type checkers

export function isIncrementalTestRecording(
  value: IncrementalTestRecording | TestRecording
): value is IncrementalTestRecording {
  // TimeStampedPointRange comes from annotations data;
  // if this is missing, the client needs to manually merge
  return !("timeStampedPointRange" in value);
}

export function isIncrementalGroupedTestCases(
  value: LegacyTestMetadata | IncrementalGroupedTestCases | GroupedTestCases
): value is IncrementalGroupedTestCases {
  const schemaVersion = (value as any).schemaVersion;
  return schemaVersion != null && satisfies(schemaVersion, "~2.0.0");
}

export function isLegacyTestMetadata(
  value: LegacyTestMetadata | IncrementalGroupedTestCases | GroupedTestCases
): value is LegacyTestMetadata {
  const version = (value as any).version;
  return version != null && version === 1;
}

export function isLegacyTestSuite(
  testSuite: LegacyTestSuite | TestSuite
): testSuite is LegacyTestSuite {
  return "results" in testSuite;
}

export function isNavigationEvent(value: TestEvent): value is NavigationEvent {
  return value.type === "navigation";
}

export function isNetworkRequestEvent(value: TestEvent): value is NetworkRequestEvent {
  return value.type === "network-request";
}

export function isTest(value: IncrementalTestRecording | TestRecording): value is TestRecording {
  // TimeStampedPointRange comes from annotations data;
  // if this is missing, the client needs to manually merge
  return "timeStampedPointRange" in value;
}

export function isTestSuite(testSuite: LegacyTestSuite | TestSuite): testSuite is TestSuite {
  return "results" in testSuite;
}

export function isGroupedTestCases(
  value: LegacyTestMetadata | IncrementalGroupedTestCases | GroupedTestCases
): value is GroupedTestCases {
  const schemaVersion = (value as any).schemaVersion;
  return schemaVersion != null && satisfies(schemaVersion, "~3.0.0");
}

export function isUserActionEvent(value: TestEvent): value is UserActionEvent {
  return value.type === "user-action" && value.timeStampedPointRange != null;
}

export function getExecutionPoint(testEvent: TestEvent): ExecutionPoint {
  if (isNavigationEvent(testEvent) || isNetworkRequestEvent(testEvent)) {
    return testEvent.timeStampedPoint.point;
  } else {
    return testEvent.timeStampedPointRange.begin.point;
  }
}

export function getTime(testEvent: TestEvent): number {
  if (isNavigationEvent(testEvent) || isNetworkRequestEvent(testEvent)) {
    return testEvent.timeStampedPoint.time;
  } else {
    return testEvent.timeStampedPointRange.begin.time;
  }
}
