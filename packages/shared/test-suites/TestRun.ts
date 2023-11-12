import { GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node as TestRunsForWorkspaceGraphQL } from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { Recording } from "shared/graphql/types";

export type Mode = "diagnostics" | "record" | "record-on-retry" | "stress";

export type SourceMetadata = {
  branchName: string | null;
  commitId: string | null;
  commitTitle: string | null;
  groupLabel: string | null;
  isPrimaryBranch: boolean | null;
  prNumber: number | null;
  prTitle: string | null;
  repository: string | null;
  triggerUrl: string | null;
  user: string | null;
};

export type TestRunTest = {
  id: string;
  testId: string;
  index: number;
  attempt: number;
  title: string;
  scope: string[];
  sourcePath: string;
  result: string;
  errors: string[] | null;
  durationMs: number;
};

export interface TestRunTestWithRecordings extends TestRunTest {
  recordings: Recording[];
}

export type __TEST = {
  testId: string;
  title: string;
  failureRate: number;
  failureRates: FailureRates;
  errorFrequency: Record<string, number>;
  executions: __EXECUTION[];
};

export type FailureRates = {
  hour: number;
  day: number;
  week: number;
  month: number;
}

export type __EXECUTION = any;

export type TestRun = {
  date: string;
  id: string;
  mode: Mode | null;
  results: {
    counts: {
      failed: number;
      flaky: number;
      passed: number;
    };
  };
  source: SourceMetadata;
};

export function processTestRun(testRun: TestRunsForWorkspaceGraphQL): TestRun {
  const { mode, results, ...rest } = testRun;

  return {
    ...rest,
    mode: mode as Mode | null,
    results,
  };
}

export function getTestRunTitle(groupedTestCases: TestRun): string {
  const { source } = groupedTestCases;
  if (source) {
    const { commitTitle, prTitle } = source;
    if (commitTitle) {
      return commitTitle;
    } else if (prTitle) {
      return prTitle;
    }
  }

  return "Test";
}
