import { gql } from "@apollo/client";

export const GET_WORKSPACE_TEST_EXECUTIONS = gql`
  query GetWorkspaceTestExecutions(
    $workspaceId: ID!
    $testId: String
    $startTime: String
    $endTime: String
  ) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        tests(filter: { testId: $testId, startTime: $startTime, endTime: $endTime }) {
          edges {
            node {
              testId
              title
              scope
              executions {
                testRunId
                errors
                createdAt
                commitTitle
                commitAuthor
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
  query GetWorkspaceTests($workspaceId: ID!, $startTime: String, $endTime: String) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        tests(filter: { startTime: $startTime, endTime: $endTime }) {
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
                flakyRate
              }
            }
          }
        }
      }
    }
  }
`;
