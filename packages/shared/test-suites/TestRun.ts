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
  export type TestSuite =
    | GetTestsRun_node_Workspace_testRuns
    | GetTestsRunsForWorkspace_node_Workspace_testRuns;
}

// This type is supported, but must be converted to version 2 format before use
export namespace TestRunV2 {
  export type TestSuiteMode = "diagnostics" | "record-on-retry" | "stress";

  export type TestSuiteBranchStatus = "closed" | "merged" | "open";

  export type TestSuiteSourceMetadata = {
    branchName: string | null;
    branchStatus: TestSuiteBranchStatus;
    commitId: string;
    triggerUrl: string | null;
    user: string | null;
  };

  // A Test Suite is a group of tests that were run together
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
}

// Export the union version of types (for type checker functions)
export type AnyTestSuite = TestRunV1.TestSuite | TestRunV2.TestSuite;

// Export the latest version of types (for convenience)
export type TestSuite = TestRunV2.TestSuite;
export type TestSuiteMode = TestRunV2.TestSuiteMode;

export function convertTestSuite(testSuite: AnyTestSuite): TestRunV2.TestSuite {
  if (isTestSuiteV2(testSuite)) {
    // If data from GraphQL is already in the new format, skip the conversion
    return testSuite;
  }

  const { branch, commitId, commitTitle, date, id, mergeId, mergeTitle, mode, stats, title, user } =
    testSuite;

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

  // TODO [FE-1543] Frontend can't distinguish between "merged" and "closed"
  // This should be stored in the data by the backend, in response to the GitHub webhook
  const branchStatus = mergeId != null ? "merged" : "open";

  // TODO [FE-1543] Some data doesn't have a title, so use a fallback for now
  const titleWithFallback = commitTitle || mergeTitle || title || "Tests";

  let source: TestRunV2.TestSuiteSourceMetadata | null = null;
  if (branch && commitId && user) {
    source = {
      branchName: branch,
      branchStatus,
      commitId,
      triggerUrl,
      user,
    };
  }

  return {
    date,
    id,
    mode: mode ? (mode as TestRunV2.TestSuiteMode) : null,
    results: {
      counts: {
        failed: stats.failed,
        flaky: 0, // TODO [FE-1543] Add this once it's available in GraphQL
        passed: stats.passed,
      },
      recordings: sortedRecordings,
    },
    source,
    title: titleWithFallback,
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

export function isTestSuiteV1(testSuite: AnyTestSuite): testSuite is TestRunV1.TestSuite {
  return !isTestSuiteV2(testSuite);
}

export function isTestSuiteV2(testSuite: AnyTestSuite): testSuite is TestRunV2.TestSuite {
  return "results" in testSuite;
}
