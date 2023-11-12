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

export async function getTestsGraphQL(
  graphQLClient: GraphQLClientInterface,
  accessToken: string | null,
  workspaceId: string
): Promise<any[]> {
  const response = await graphQLClient.send<any>(
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
    (response.node as any).tests?.edges.map(
      edge => edge.node
    ) ?? []
  );
}
