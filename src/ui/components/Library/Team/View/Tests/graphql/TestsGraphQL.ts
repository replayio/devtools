import { gql } from "@apollo/client";

import {
  GetTestsForWorkspace,
  GetTestsForWorkspace_node_Workspace,
  GetTestsForWorkspace_node_Workspace_tests_edges_node,
} from "shared/graphql/generated/GetTestsForWorkspace";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";

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
            }
          }
        }
      }
    }
  }
`;

export async function getTestsGraphQL(
  graphQLClient: GraphQLClientInterface,
  accessToken: string | null,
  workspaceId: string
): Promise<GetTestsForWorkspace_node_Workspace_tests_edges_node[]> {
  const response = await graphQLClient.send<GetTestsForWorkspace>(
    {
      operationName: "GetTestsForWorkspace",
      query: GET_TESTS,
      variables: { workspaceId },
    },
    accessToken
  );

  if (response?.node == null) {
    return [];
  }

  return (
    (response.node as GetTestsForWorkspace_node_Workspace).tests?.edges.map(edge => edge.node) ?? []
  );
}
