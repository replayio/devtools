import { gql } from "@apollo/client";

import {
  GetTestsRunRecordings,
  GetTestsRunRecordings_node_Workspace,
  GetTestsRunRecordings_node_Workspace_testRuns_edges_node_results_recordings,
} from "shared/graphql/generated/GetTestsRunRecordings";
import {
  GetTestsRunsForWorkspace,
  GetTestsRunsForWorkspace_node_Workspace,
  GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node,
} from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";

const GET_TEST_RUN_RECORDINGS = gql`
  query GetTestsRun($workspaceId: ID!, $id: String!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        testRuns(id: $id) {
          edges {
            node {
              results {
                recordings {
                  uuid
                  duration
                  isProcessed
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
  }
`;

const GET_TEST_RUNS = gql`
  query GetTestsRunsForWorkspace($workspaceId: ID!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        testRuns {
          edges {
            node {
              id
              date
              mode
              results {
                counts {
                  failed
                  flaky
                  passed
                }
              }
              source {
                commitId
                commitTitle
                groupLabel
                isPrimaryBranch
                branchName
                prNumber
                prTitle
                repository
                triggerUrl
                user
              }
            }
          }
        }
      }
    }
  }
`;

export async function getTestRunRecordingsGraphQL(
  graphQLClient: GraphQLClientInterface,
  accessToken: string | null,
  workspaceId: string,
  summaryId: string
): Promise<GetTestsRunRecordings_node_Workspace_testRuns_edges_node_results_recordings[]> {
  const response = await graphQLClient.send<GetTestsRunRecordings>(
    {
      operationName: "GetTestsRun",
      query: GET_TEST_RUN_RECORDINGS,
      variables: { id: summaryId, workspaceId },
    },
    accessToken
  );

  if (response?.node == null) {
    return [];
  }

  return (
    (response.node as GetTestsRunRecordings_node_Workspace).testRuns?.edges[0]?.node.results
      .recordings ?? []
  );
}

export async function getTestRunsGraphQL(
  graphQLClient: GraphQLClientInterface,
  accessToken: string | null,
  workspaceId: string
): Promise<GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node[]> {
  const response = await graphQLClient.send<GetTestsRunsForWorkspace>(
    {
      operationName: "GetTestsRunsForWorkspace",
      query: GET_TEST_RUNS,
      variables: { workspaceId },
    },
    accessToken
  );

  if (response?.node == null) {
    return [];
  }

  return (
    (response.node as GetTestsRunsForWorkspace_node_Workspace).testRuns?.edges.map(
      edge => edge.node
    ) ?? []
  );
}
