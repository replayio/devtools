import { gql, useQuery } from "@apollo/client";
import orderBy from "lodash/orderBy";
import { useMemo } from "react";

import { assert } from "protocol/utils";
import { GetTestsRun, GetTestsRunVariables } from "shared/graphql/generated/GetTestsRun";
import {
  GetTestsRunsForWorkspace,
  GetTestsRunsForWorkspaceVariables,
} from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { Summary, convertSummary } from "shared/test-suites/TestRun";
import { WorkspaceId } from "ui/state/app";

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
          mode
          repository
          user
          date
          stats {
            failed
            flaky
            passed
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
          mode
          repository
          user
          date
          stats {
            failed
            flaky
            passed
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

export function useGetTestRunForWorkspace(
  workspaceId: string,
  summaryId: string
): {
  summary: Summary | null;
  loading: boolean;
} {
  const { data, loading } = useQuery<GetTestsRun, GetTestsRunVariables>(GET_TEST_RUN, {
    variables: { id: summaryId, workspaceId },
  });

  if (loading || !data?.node) {
    return { summary: null, loading };
  }
  assert("testRuns" in data.node, "No results in GetTestsRun response");

  const summary = data.node.testRuns?.[0];

  return {
    summary: summary ? convertSummary(summary) : null,
    loading,
  };
}

export function useGetTestRunsForWorkspace(workspaceId: WorkspaceId): {
  loading: boolean;
  summaries: Summary[];
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
      return { summaries: [], loading };
    }
    assert("testRuns" in data.node, "No testRuns in GetTestsRun response");

    const summaries: Summary[] = [];

    // Convert legacy test runs; filter out ones with invalid data
    data.node.testRuns?.forEach(legacySummary => {
      try {
        summaries.push(convertSummary(legacySummary));
      } catch (error) {
        // Filter out and ignore data that's too old or corrupt to defined the required fields
      }
    });

    const sortedSummaries = orderBy(summaries, "date", "desc");

    return {
      loading,
      summaries: sortedSummaries,
    };
  }, [data, loading]);
}
