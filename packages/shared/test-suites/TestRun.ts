import { GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node as TestRunsForWorkspaceGraphQL } from "shared/graphql/generated/GetTestsRunsForWorkspace";

export type Mode = "diagnostics" | "record" | "record-on-retry" | "stress";

export type SourceMetadata = {
  branchName: string | null;
  commitId: string;
  commitTitle: string | null;
  groupLabel: string | null;
  isPrimaryBranch: boolean;
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
  error: string | null;
  durationMs: number;
  recordingId: string | null;
};

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
  source: SourceMetadata | null;
  tests: TestRunTest[];
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
