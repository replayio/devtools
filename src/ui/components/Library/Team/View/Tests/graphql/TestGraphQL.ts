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
                  uuid
                  title
                  isProcessed
                  duration
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

export const GET_WORKSPACE_TESTS = gql`
  query GetWorkspaceTests($workspaceId: ID!) {
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
                failureRate
              }
            }
          }
        }
      }
    }
  }
`;
