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

export interface TestRunStats {
  passed: number | null;
  failed: number | null;
}

export interface TestRun {
  id: string | null;
  title: string | null;
  commitTitle: string | null;
  commitId: string | null;
  mergeTitle: string | null;
  mergeId: string | null;
  user: string | null;
  date: string;
  branch: string | null;
  mode: string | null;
  stats: TestRunStats | null;
  recordings?: Recording[];
  triggerUrl?: string;
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
          mode
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
          mode
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
    testRun: convertTestRun(testRun),
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

    const testRuns = data.node.testRuns?.map(testRun => convertTestRun(testRun)!);
    const sortedTestRuns = orderBy(testRuns, "date", "desc");

    return {
      testRuns: sortedTestRuns,
      loading,
    };
  }, [data, loading]);
}

function convertTestRun(
  testRun:
    | GetTestsRun_node_Workspace_testRuns
    | GetTestsRunsForWorkspace_node_Workspace_testRuns
    | undefined
): TestRun | null {
  if (!testRun) {
    return null;
  }
  const recordings = "recordings" in testRun ? unwrapRecordingsData(testRun.recordings) : [];
  const sortedRecordings = orderBy(recordings, "date", "desc");
  const firstRecording = sortedRecordings[0];

  return {
    ...testRun,
    recordings,
    triggerUrl: firstRecording?.metadata?.source?.trigger?.url,
  };
}
