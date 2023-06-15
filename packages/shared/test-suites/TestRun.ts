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
  export type Summary =
    | GetTestsRun_node_Workspace_testRuns
    | GetTestsRunsForWorkspace_node_Workspace_testRuns;
}

// This type is supported, but must be converted to version 2 format before use
export namespace TestRunV2 {
  export type Mode = "diagnostics" | "record-on-retry" | "stress";

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

  export interface Summary {
    date: string;
    id: string;
    mode: Mode | null;
    results: {
      counts: {
        failed: number;
        flaky: number;
        passed: number;
      };
      recordings: Recording[];
    };
    source: SourceMetadata | null;
  }
}

// Export the union version of types (for type checker functions)
export type AnySummary = TestRunV1.Summary | TestRunV2.Summary;

// Export the latest version of types (for convenience)
export type Summary = TestRunV2.Summary;
export type Mode = TestRunV2.Mode;
export type SourceMetadata = TestRunV2.SourceMetadata;

export function convertSummary(summary: AnySummary): TestRunV2.Summary {
  if (isTestRunV2(summary)) {
    // If data from GraphQL is already in the new format, skip the conversion
    return summary;
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
  } = summary;

  // Verify expected data; if any of these are missing, we can't reliably migrate the data
  assert(date != null, "Expected legacy TestRun data to have a data");
  assert(id != null, "Expected legacy TestRun data to have a identifier");
  assert(
    stats != null && stats.failed != null && stats.passed != null,
    "Expected legacy TestRun data to have pass/fail stats"
  );

  const recordings = "recordings" in summary ? unwrapRecordingsData(summary.recordings) : [];
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

  let source: TestRunV2.SourceMetadata | null = null;
  if (branch && commitId && user) {
    const prNumber = mergeId != null ? parseInt(mergeId) : null;

    source = {
      branchName: branch,
      commitId,
      commitTitle,
      groupLabel: title,
      isPrimaryBranch,
      prNumber: prNumber && !isNaN(prNumber) ? prNumber : null,
      prTitle: mergeTitle,
      repository,
      triggerUrl,
      user,
    };
  }

  return {
    date,
    id,
    mode: mode ? (mode as TestRunV2.Mode) : null,
    results: {
      counts: {
        failed: stats.failed,
        flaky: stats.flaky ?? 0,
        passed: stats.passed,
      },
      recordings: sortedRecordings,
    },
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

export function getTestRunTitle(groupedTestCases: AnySummary): string {
  if (isTestRunV1(groupedTestCases)) {
    const { commitTitle, mergeTitle } = groupedTestCases;
    if (commitTitle) {
      return commitTitle;
    } else if (mergeTitle) {
      return mergeTitle;
    }
  } else {
    const { source } = groupedTestCases;
    if (source) {
      const { commitTitle, prTitle } = source;
      if (commitTitle) {
        return commitTitle;
      } else if (prTitle) {
        return prTitle;
      }
    }
  }

  return "Test";
}

export function isTestRunV1(summary: AnySummary): summary is TestRunV1.Summary {
  return !isTestRunV2(summary);
}

export function isTestRunV2(summary: AnySummary): summary is TestRunV2.Summary {
  return "results" in summary;
}
