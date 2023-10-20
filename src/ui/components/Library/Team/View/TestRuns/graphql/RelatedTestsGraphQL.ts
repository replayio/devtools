import { gql } from "@apollo/client";

import {
  GetRelatedTests,
  GetRelatedTests_node_Workspace,
  GetRelatedTests_node_Workspace_relatedTests_edges,
} from "shared/graphql/generated/GetRelatedTests";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";

const GET_RELATED_TESTS = gql`
  query GetRelatedTests($workspaceId: ID!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        relatedTests {
          edges {
            node {
              testId
              title
              tests {
                title
                runTitle
                commitTitle
                recordingId
                result
                recording {
                  id
                  title
                  createdAt
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function getRelatedTestsGraphQL(
  graphqlClient: GraphQLClientInterface,
  accessToken: string | null,
  workspaceId: string
): Promise<GetRelatedTests_node_Workspace_relatedTests_edges[] | null> {
  const response = await graphqlClient.send<GetRelatedTests>(
    {
      operationName: "GetRelatedTests",
      query: GET_RELATED_TESTS,
      variables: { workspaceId },
    },
    accessToken
  );

  if (response?.node == null) {
    return [];
  }

  return (response.node as GetRelatedTests_node_Workspace).relatedTests?.edges ?? [];
}
