import { gql } from "@apollo/client";

import {
  GetTestPreviewsForWorkspace,
  GetTestPreviewsForWorkspace_node_Workspace,
  GetTestPreviewsForWorkspace_node_Workspace_tests_edges_node,
} from "shared/graphql/generated/GetTestPreviewsForWorkspace";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";

const GET_TEST_PREVIEWS = gql`
  query GetTestPreviewsForWorkspace($workspaceId: ID!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        tests {
          edges {
            node {
              testId
              title
              scope
              stats {
                passed
                failed
                flaky
                skipped
                unknown
              }
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
): Promise<GetTestPreviewsForWorkspace_node_Workspace_tests_edges_node[]> {
  const response = await graphQLClient.send<GetTestPreviewsForWorkspace>(
    {
      operationName: "GetTestPreviewsForWorkspace",
      query: GET_TEST_PREVIEWS,
      variables: { workspaceId },
    },
    accessToken
  );

  if (response?.node == null) {
    return [];
  }

  return (
    (response.node as GetTestPreviewsForWorkspace_node_Workspace).tests?.edges.map(
      edge => edge.node
    ) ?? []
  );
}
