import { gql } from "@apollo/client";
import {
  GetTestsRunsForWorkspace_node_Workspace,
} from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";

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
                title
                result
                runnerName
                runnerVersion
                createdAt
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
  console.log("gettestsgraphql")

  const response = await graphQLClient.send<any>(
    {
      operationName: "GetTestsForWorkspace",
      query: GET_TESTS,
      variables: { workspaceId },
    },
    accessToken
  );

  console.log({response});

  if (response?.node == null) {
    return [];
  }

  return (
    (response.node as any).tests?.edges.map(
      edge => edge.node
    ) ?? []
  );
}
