import { gql, useQuery } from "@apollo/client";
import orderBy from "lodash/orderBy";
import { useMemo } from "react";

import { assert } from "protocol/utils";
import { GetTest_node_Workspace_tests_recordings } from "shared/graphql/generated/GetTest";
import {
  GetTestsRun,
  GetTestsRunVariables,
  GetTestsRun_node_Workspace_testRuns,
  GetTestsRun_node_Workspace_testRuns_recordings,
} from "shared/graphql/generated/GetTestsRun";
import {
  GetTestsRunsForWorkspace,
  GetTestsRunsForWorkspaceVariables,
  GetTestsRunsForWorkspace_node_Workspace_testRuns,
} from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { Recording } from "shared/graphql/types";
import { WorkspaceId } from "ui/state/app";

export type TestRunMode = "diagnostics" | "record-on-retry" | "stress";
export type TestRunBranchStatus = "closed" | "merged" | "open";
export type TestRunSourceMetadata = {
  branchName: string;
  branchStatus: TestRunBranchStatus;
  commitId: string;
  triggerUrl: string | null;
  user: string;
};

export interface TestRun {
  date: string;
  id: string;
  mode: TestRunMode | null;
  results: {
    counts: {
      failed: number;
      flaky: number;
      passed: number;
    };
    recordings: Recording[];
  };
  source: TestRunSourceMetadata | null;
  title: string;
}

const GET_TEST_RUNS_FOR_WORKSPACE = gql`
  query GetTestsRunsForWorkspace($workspaceId: ID!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        testRuns {
          id
          title
          branch
          commitId
          commitTitle
          mergeId
          mergeTitle
          user
          date
          stats {
            passed
            failed
          }
        }
      }
    }
  }
`;

export const GET_TEST_RUN = gql`
  query GetTestsRun($workspaceId: ID!, $id: String!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        testRuns(id: $id) {
          id
          title
          branch
          commitId
          commitTitle
          mergeId
          mergeTitle
          user
          date
          stats {
            passed
            failed
          }
          recordings {
            edges {
              node {
                uuid
                duration
                createdAt
                metadata
                comments {
                  user {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function unwrapRecordingsData(
  recordings:
    | GetTest_node_Workspace_tests_recordings
    | GetTestsRun_node_Workspace_testRuns_recordings
    | null
): Recording[] | undefined {
  if (!recordings) {
    return undefined;
  }
  return recordings.edges.map(e => ({
    ...e.node,
    id: e.node.uuid,
    date: e.node.createdAt,
  }));
}

export function useGetTestRunForWorkspace(
  workspaceId: string,
  testRunId: string
): {
  testRun: TestRun | null;
  loading: boolean;
} {
  const { data, loading } = useQuery<GetTestsRun, GetTestsRunVariables>(GET_TEST_RUN, {
    variables: { id: testRunId, workspaceId },
  });

  if (loading || !data?.node) {
    return { testRun: null, loading };
  }
  assert("testRuns" in data.node, "No testRuns in GetTestsRun response");

  const testRun = data.node.testRuns?.[0];

  return {
    testRun: testRun ? convertLegacyTestRunToNewFormat(testRun) : null,
    loading,
  };
}

export function useGetTestRunsForWorkspace(workspaceId: WorkspaceId): {
  testRuns: TestRun[];
  loading: boolean;
} {
  // TODO [FE-1530] Pagination test runs from GraphQL
  const { data, loading } = useQuery<GetTestsRunsForWorkspace, GetTestsRunsForWorkspaceVariables>(
    GET_TEST_RUNS_FOR_WORKSPACE,
    {
      variables: { workspaceId },
    }
  );

  return useMemo(() => {
    if (loading || !data?.node) {
      return { testRuns: [], loading };
    }
    assert("testRuns" in data.node, "No testRuns in GetTestsRun response");

    const testRuns: TestRun[] = [];

    // Convert legacy test runs; filter out ones with invalid data
    data.node.testRuns?.forEach(legacyTestRun => {
      try {
        testRuns.push(convertLegacyTestRunToNewFormat(legacyTestRun));
      } catch (error) {
        // Filter out and ignore data that's too old or corrupt to defined the required fields
      }
    });

    const sortedTestRuns = orderBy(testRuns, "date", "desc");

    return {
      testRuns: sortedTestRuns,
      loading,
    };
  }, [data, loading]);
}

// TODO [FE-1419] Remove this eventually (when we drop support for legacy data format)
export function convertLegacyTestRunToNewFormat(testRun: unknown): TestRun {
  // If data from GraphQL is already in the new format, skip the conversion
  if (isTestRun(testRun)) {
    return testRun;
  }

  const legacyTestRun = testRun as
    | GetTestsRun_node_Workspace_testRuns
    | GetTestsRunsForWorkspace_node_Workspace_testRuns;

  const { branch, commitId, commitTitle, date, id, mergeId, mergeTitle, mode, stats, title, user } =
    legacyTestRun;

  // Verify expected data; if any of these are missing, we can't reliably migrate the data
  assert(date != null, "Expected legacy TestRun data to have a data");
  assert(id != null, "Expected legacy TestRun data to have a identifier");
  assert(
    stats != null && stats.failed != null && stats.passed != null,
    "Expected legacy TestRun data to have pass/fail stats"
  );

  const recordings =
    "recordings" in legacyTestRun ? unwrapRecordingsData(legacyTestRun.recordings) : [];
  const sortedRecordings = orderBy(recordings, "date", "desc");

  const firstRecording = sortedRecordings[0];
  const triggerUrl = firstRecording?.metadata?.source?.trigger?.url ?? null;

  // TODO [FE-1543] Frontend can't distinguish between "merged" and "closed"
  // This should be stored in the data by the backend, in response to the GitHub webhook
  const branchStatus = mergeId != null ? "merged" : "open";

  // TODO [FE-1543] Some data doesn't have a title, so use a fallback for now
  const titleWithFallback = commitTitle || mergeTitle || title || "Tests";

  let source: TestRunSourceMetadata | null = null;
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
    mode: mode ? (mode as TestRunMode) : null,
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

function isTestRun(testRun: any): testRun is TestRun {
  return "results" in testRun;
}
