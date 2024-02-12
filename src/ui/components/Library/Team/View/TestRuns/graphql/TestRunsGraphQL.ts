import { gql } from "@apollo/client";

import {
  GetTestRunRecordings,
  GetTestRunRecordings_node_Workspace,
  GetTestRunRecordings_node_Workspace_testRuns_edges_node,
  GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests,
} from "shared/graphql/generated/GetTestRunRecordings";
import {
  GetTestsRunsForWorkspace,
  GetTestsRunsForWorkspace_node_Workspace,
  GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node,
} from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";

const GET_TEST_RUN_RECORDINGS = gql`
  query GetTestRunRecordings($workspaceId: ID!, $id: String!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        testRuns(id: $id) {
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
              tests(includeNonRecorded: true) {
                id
                testId
                title
                scope
                sourcePath
                result
                errors
                durationMs
                index
                attempt
                executions {
                  result
                  recordings {
                    uuid
                    duration
                    isProcessed
                    createdAt
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
  }
`;

const GET_TEST_RUNS = gql`
  query GetTestsRunsForWorkspace($workspaceId: ID!, $startTime: String, $endTime: String) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        testRuns(filter: { startTime: $startTime, endTime: $endTime }) {
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

export async function getTestRunTestsWithRecordingsGraphQL(
  graphQLClient: GraphQLClientInterface,
  accessToken: string | null,
  workspaceId: string,
  summaryId: string
): Promise<GetTestRunRecordings_node_Workspace_testRuns_edges_node | null> {
  const response = await graphQLClient.send<GetTestRunRecordings>(
    {
      operationName: "GetTestRunRecordings",
      query: GET_TEST_RUN_RECORDINGS,
      variables: { id: summaryId, workspaceId },
    },
    accessToken
  );

  if (response?.node == null) {
    return null;
  }

  return (response.node as GetTestRunRecordings_node_Workspace).testRuns?.edges[0]?.node ?? null;
}

export async function getTestRunsGraphQL(
  graphQLClient: GraphQLClientInterface,
  accessToken: string | null,
  workspaceId: string,
  startTime?: string | null,
  endTime?: string | null
): Promise<GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node[]> {
  const response = await graphQLClient.send<GetTestsRunsForWorkspace>(
    {
      operationName: "GetTestsRunsForWorkspace",
      query: GET_TEST_RUNS,
      variables: { workspaceId, startTime, endTime },
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
