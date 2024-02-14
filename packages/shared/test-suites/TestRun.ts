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
  result: "passed" | "failed" | "flaky" | "skipped" | "timedOut" | "unknown";
  errors: string[] | null;
  durationMs: number;
};

export interface TestRunTestWithRecordings extends TestRunTest {
  executions: {
    result: TestRunTest["result"];
    recordings: Recording[];
  }[];
}

export type Test = {
  testId: string;
  title: string;
  failureRate: number;
  flakyRate: number;
};

export type TestWithExecutions = Test & {
  executions: TestExecution[];
  failureRate: number;
  failureRates: FailureRates;
  errorFrequency: Record<string, number>;
};

export type FailureRates = {
  hour: number;
  day: number;
  week: number;
  month: number;
};

export type TestExecution = {
  errors: string[] | null;
  createdAt: string;
  result: string;
  commitTitle: string | null;
  commitAuthor: string | null;
  testRunId: string;
  recordings: Pick<Recording, "id" | "title" | "isProcessed">[];
};

export type GroupedTestRun = {
  testRunId: string;
  executions: TestExecution[];
  date: string;
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

export function filterTestRun(
  testRun: TestRun,
  {
    status,
    text,
    branch,
  }: {
    status: string;
    text: string;
    branch: string;
  }
) {
  const lowerCaseText = text.toLowerCase();
  if (status === "failed") {
    if (testRun.results.counts.failed === 0) {
      return false;
    }
  }

  const branchName = testRun.source?.branchName ?? "";

  if (branch === "primary") {
    // TODO This should be configurable by Workspace
    if (branchName !== "main" && branchName !== "master") {
      return false;
    }
  }

  if (text !== "") {
    const user = testRun.source?.user ?? "";
    const title = getTestRunTitle(testRun);

    if (
      !branchName.toLowerCase().includes(lowerCaseText) &&
      !user.toLowerCase().includes(lowerCaseText) &&
      !title.toLowerCase().includes(lowerCaseText)
    ) {
      return false;
    }
  }

  return true;
}
