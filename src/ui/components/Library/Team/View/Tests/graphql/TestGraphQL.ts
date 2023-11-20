import { gql } from "@apollo/client";

export const GET_TEST = gql`
  query GetTestForWorkspace($workspaceId: ID!, $testId: String) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        tests(filter: { testId: $testId }) {
          edges {
            node {
              testId
              title
              scope
              executions {
                errors
                createdAt
                commitTitle
                result
                recordings {
                  id
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`;
