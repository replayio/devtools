import orderBy from "lodash/orderBy";

import { assert } from "protocol/utils";
import { GetTest_node_Workspace_tests_recordings } from "shared/graphql/generated/GetTest";
import {
  GetTestsRun_node_Workspace_testRuns,
  GetTestsRun_node_Workspace_testRuns_recordings,
} from "shared/graphql/generated/GetTestsRun";
import { GetTestsRunsForWorkspace_node_Workspace_testRuns } from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { Recording } from "shared/graphql/types";
import {
  TestSuite,
  TestSuiteMode,
  TestSuiteSourceMetadata,
  isTestSuite,
} from "shared/test-suites/types";

// TODO [FE-1419] Remove this eventually (when we drop support for legacy data format)
export function convertLegacyTestRunToTestSuite(
  testSuite:
    | GetTestsRun_node_Workspace_testRuns
    | GetTestsRunsForWorkspace_node_Workspace_testRuns
    | TestSuite
): TestSuite {
  if (isTestSuite(testSuite)) {
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

  let source: TestSuiteSourceMetadata | null = null;
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
    mode: mode ? (mode as TestSuiteMode) : null,
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
