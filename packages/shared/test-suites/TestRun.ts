import orderBy from "lodash/orderBy";

import { assert } from "protocol/utils";
import { GetTest_node_Workspace_tests_recordings } from "shared/graphql/generated/GetTest";
import {
  GetTestsRun_node_Workspace_testRuns,
  GetTestsRun_node_Workspace_testRuns_recordings,
} from "shared/graphql/generated/GetTestsRun";
import { GetTestsRunsForWorkspace_node_Workspace_testRuns } from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { Recording } from "shared/graphql/types";

// This type is supported, but must be converted to version 2 format before use
export namespace TestRunV1 {
  export type GroupedTestCases =
    | GetTestsRun_node_Workspace_testRuns
    | GetTestsRunsForWorkspace_node_Workspace_testRuns;
}

// This type is supported, but must be converted to version 2 format before use
export namespace TestRunV2 {
  export type Mode = "diagnostics" | "record-on-retry" | "stress";

  export type SourceMetadata = {
    branchName: string | null;
    commitId: string;
    isPrimaryBranch: boolean;
    prNumber: number | null;
    prTitle: string | null;
    repository: string | null;
    triggerUrl: string | null;
    user: string | null;
  };

  export interface GroupedTestCases {
    date: string;
    id: string;
    mode: Mode | null;
    primaryTitle: string;
    results: {
      counts: {
        failed: number;
        flaky: number;
        passed: number;
      };
      recordings: Recording[];
    };
    secondaryTitle: string | null;
    source: SourceMetadata | null;
  }
}

// Export the union version of types (for type checker functions)
export type AnyGroupedTestCases = TestRunV1.GroupedTestCases | TestRunV2.GroupedTestCases;

// Export the latest version of types (for convenience)
export type GroupedTestCases = TestRunV2.GroupedTestCases;
export type Mode = TestRunV2.Mode;
export type SourceMetadata = TestRunV2.SourceMetadata;

export function convertTestSuite(testSuite: AnyGroupedTestCases): TestRunV2.GroupedTestCases {
  if (isTestSuiteV2(testSuite)) {
    // If data from GraphQL is already in the new format, skip the conversion
    return testSuite;
  }

  const {
    branch,
    commitId,
    commitTitle,
    date,
    id,
    mergeId,
    mergeTitle,
    mode,
    repository,
    stats,
    title,
    user,
  } = testSuite;

  // Verify expected data; if any of these are missing, we can't reliably migrate the data
  assert(date != null, "Expected legacy TestRun data to have a data");
  assert(id != null, "Expected legacy TestRun data to have a identifier");
  assert(
    stats != null && stats.failed != null && stats.passed != null,
    "Expected legacy TestRun data to have pass/fail stats"
  );

  const recordings = "recordings" in testSuite ? unwrapRecordingsData(testSuite.recordings) : [];
  const sortedRecordings = orderBy(recordings, "date", "desc");

  const firstRecording = sortedRecordings[0];
  const triggerUrl = firstRecording?.metadata?.source?.trigger?.url ?? null;

  // This is a little hacky, but it's our best way to roughly detect the "primary" branch
  let isPrimaryBranch = false;
  switch (branch) {
    case "main":
    case "master":
      isPrimaryBranch = true;
      break;
  }

  const prNumber = mergeId != null ? parseInt(mergeId) : null;
  const prTitle = mergeTitle ?? null;

  const titleWithFallback = commitTitle || mergeTitle || "Tests";

  let source: TestRunV2.SourceMetadata | null = null;
  if (branch && commitId && user) {
    source = {
      branchName: branch,
      commitId,
      isPrimaryBranch,
      prNumber: prNumber && !isNaN(prNumber) ? prNumber : null,
      prTitle,
      repository,
      triggerUrl,
      user,
    };
  }

  return {
    date,
    id,
    mode: mode ? (mode as TestRunV2.Mode) : null,
    primaryTitle: titleWithFallback,
    results: {
      counts: {
        failed: stats.failed,
        flaky: stats.flaky ?? 0,
        passed: stats.passed,
      },
      recordings: sortedRecordings,
    },
    secondaryTitle: title,
    source,
  };
}

function unwrapRecordingsData(
  recordings:
    | GetTest_node_Workspace_tests_recordings
    | GetTestsRun_node_Workspace_testRuns_recordings
    | null
): Recording[] | undefined {
  if (!recordings) {
    return undefined;
  }
  return recordings.edges.map(edge => ({
    ...edge.node,
    id: edge.node.uuid,
    date: edge.node.createdAt,
  }));
}

export function isTestSuiteV1(
  testSuite: AnyGroupedTestCases
): testSuite is TestRunV1.GroupedTestCases {
  return !isTestSuiteV2(testSuite);
}

export function isTestSuiteV2(
  testSuite: AnyGroupedTestCases
): testSuite is TestRunV2.GroupedTestCases {
  return "results" in testSuite;
}
