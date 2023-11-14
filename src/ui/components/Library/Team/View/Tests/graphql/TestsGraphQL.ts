import { gql } from "@apollo/client";
import {
  GetTestsRunsForWorkspace_node_Workspace,
} from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";

import GetTestsForWorkspaces from "./fixtures/GetTestsForWorkspace.json"

// const GET_TEST_RUNS = gql`
const GET_TESTS = gql`
  query GetTestsForWorkspace($workspaceId: ID!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        tests {
          edges {
            node {
              testId
              title
              scope
              executions {
                errors
                createdAt
                result
              }
            }
          }
        }
      }
    }
  }
`;

// TODO: Populate these types -jvv
type _GetTestsForWorkspace = any;
type _GetTestsForWorkspace_node_Workspace = any;
type _GetTestsForWorkspace_node_Workspace_tests_edges= any;
type _GetTestsForWorkspace_node_Workspace_tests_edges_node = any;

export async function getTestsGraphQL(
  graphQLClient: GraphQLClientInterface,
  accessToken: string | null,
  workspaceId: string
): Promise<_GetTestsForWorkspace_node_Workspace_tests_edges_node[]> {
  const response = await graphQLClient.send<_GetTestsForWorkspace>(
    {
      operationName: "GetTestsForWorkspace",
      query: GET_TESTS,
      variables: { workspaceId },
    },
    accessToken
  );

  console.log({ response });

  if (response?.node == null) {
    return [];
  }

  return (
    (response.node as _GetTestsForWorkspace_node_Workspace).tests?.edges.map(
      (edge: _GetTestsForWorkspace_node_Workspace_tests_edges) => edge.node
    ) ?? []
  );
}
