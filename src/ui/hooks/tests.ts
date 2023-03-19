import { gql, useQuery } from "@apollo/client";
import orderBy from "lodash/orderBy";

import { assert } from "protocol/utils";
import {
  GetTest,
  GetTestVariables,
  GetTest_node_Workspace_tests,
  GetTest_node_Workspace_tests_recordings,
} from "shared/graphql/generated/GetTest";
import {
  GetTestsForWorkspace,
  GetTestsForWorkspaceVariables,
} from "shared/graphql/generated/GetTestsForWorkspace";
import {
  GetTestsRun,
  GetTestsRunVariables,
  GetTestsRun_node_Workspace_testRuns,
  GetTestsRun_node_Workspace_testRuns_recordings,
} from "shared/graphql/generated/GetTestsRun";
import {
  GetTestsRunsForWorkspace,
  GetTestsRunsForWorkspaceVariables,
  GetTestsRunsForWorkspace_node_Workspace_testRuns,
} from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { Recording } from "shared/graphql/types";
import { WorkspaceId } from "ui/state/app";

export interface Test {
  title: string | null;
  path: string[] | null;
  date: string;
  recordings: Recording[];
}

export interface TestRunStats {
  passed: number | null;
  failed: number | null;
}
export interface TestRun {
  id: string | null;
  title: string | null;
  commitTitle: string | null;
  commitId: string | null;
  mergeTitle: string | null;
  mergeId: string | null;
  user: string | null;
  date: string;
  branch: string | null;
  mode: string | null;
  stats: TestRunStats | null;
  recordings?: Recording[];
  triggerUrl?: string;
}

const GET_TESTS_FOR_WORKSPACE = gql`
  query GetTestsForWorkspace($workspaceId: ID!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        tests {
          title
          path
          recordings {
            edges {
              node {
                uuid
                duration
                createdAt
                metadata
              }
            }
          }
        }
      }
    }
  }
`;

const GET_TEST_RUNS_FOR_WORKSPACE = gql`
  query GetTestsRunsForWorkspace($workspaceId: ID!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        testRuns {
          id
          title
          branch
          commitId
          commitTitle
          mergeId
          mergeTitle
          user
          date
          mode
          stats {
            passed
            failed
          }
        }
      }
    }
  }
`;

const GET_TEST = gql`
  query GetTest($workspaceId: ID!, $path: String!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        tests(path: $path) {
          title
          path
          recordings {
            edges {
              node {
                uuid
                duration
                createdAt
                metadata
              }
            }
          }
        }
      }
    }
  }
`;

const GET_TEST_RUN = gql`
  query GetTestsRun($workspaceId: ID!, $id: String!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        testRuns(id: $id) {
          id
          title
          branch
          commitId
          commitTitle
          mergeId
          mergeTitle
          user
          date
          mode
          stats {
            passed
            failed
          }
          recordings {
            edges {
              node {
                uuid
                duration
                createdAt
                metadata
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
`;

function unwrapRecordingsData(
  recordings:
    | GetTest_node_Workspace_tests_recordings
    | GetTestsRun_node_Workspace_testRuns_recordings
    | null
): Recording[] | undefined {
  if (!recordings) {
    return undefined;
  }
  return recordings.edges.map(e => ({
    ...e.node,
    id: e.node.uuid,
    date: e.node.createdAt,
  }));
}

export function useGetTestForWorkspace(
  path: string[],
  workspaceId: string
): { test: Test | null; loading: boolean } {
  const serializedPath = encodeURIComponent(JSON.stringify(path));
  const { data, loading } = useQuery<GetTest, GetTestVariables>(GET_TEST, {
    variables: { path: serializedPath, workspaceId },
  });

  if (loading || !data?.node) {
    return { test: null, loading };
  }
  assert("tests" in data.node, "No tests in GetTest response");

  return {
    test: convertTest(data.node.tests?.[0]),
    loading,
  };
}

export function useGetTestRunForWorkspace(
  workspaceId: string,
  testRunId: string
): {
  testRun: TestRun | null;
  loading: boolean;
} {
  const { data, loading } = useQuery<GetTestsRun, GetTestsRunVariables>(GET_TEST_RUN, {
    variables: { id: testRunId, workspaceId },
  });

  if (loading || !data?.node) {
    return { testRun: null, loading };
  }
  assert("testRuns" in data.node, "No testRuns in GetTestsRun response");

  const testRun = data.node.testRuns?.[0];

  return {
    testRun: convertTestRun(testRun),
    loading,
  };
}

export function useGetTestsForWorkspace(workspaceId: WorkspaceId): {
  tests: Test[] | null;
  loading: boolean;
} {
  const { data, loading } = useQuery<GetTestsForWorkspace, GetTestsForWorkspaceVariables>(
    GET_TESTS_FOR_WORKSPACE,
    {
      variables: { workspaceId },
    }
  );

  if (loading || !data?.node || !("tests" in data.node) || !data.node.tests) {
    return { tests: null, loading };
  }

  const tests = data.node.tests.map(test => convertTest(test)!);
  const sortedTests = orderBy(tests, ["date"], ["desc"]);

  return {
    tests: sortedTests,
    loading,
  };
}

function convertTest(test: GetTest_node_Workspace_tests | undefined) {
  if (!test) {
    return null;
  }
  const recordings = unwrapRecordingsData(test.recordings);
  const sortedRecordings = orderBy(recordings, "date", "desc");
  const firstRecording = sortedRecordings[0];

  return {
    ...test,
    date: firstRecording.date,
    recordings: sortedRecordings,
  };
}

export function useGetTestRunsForWorkspace(workspaceId: WorkspaceId): {
  testRuns: TestRun[] | null;
  loading: boolean;
} {
  const { data, loading } = useQuery<GetTestsRunsForWorkspace, GetTestsRunsForWorkspaceVariables>(
    GET_TEST_RUNS_FOR_WORKSPACE,
    {
      variables: { workspaceId },
    }
  );

  if (loading || !data?.node) {
    return { testRuns: null, loading };
  }
  assert("testRuns" in data.node, "No testRuns in GetTestsRun response");

  const testRuns = data.node.testRuns?.map(testRun => convertTestRun(testRun)!);
  const sortedTestRuns = orderBy(testRuns, "date", "desc");

  return {
    testRuns: sortedTestRuns,
    loading,
  };
}

function convertTestRun(
  testRun:
    | GetTestsRun_node_Workspace_testRuns
    | GetTestsRunsForWorkspace_node_Workspace_testRuns
    | undefined
): TestRun | null {
  if (!testRun) {
    return null;
  }
  const recordings = "recordings" in testRun ? unwrapRecordingsData(testRun.recordings) : [];
  const sortedRecordings = orderBy(recordings, "date", "desc");
  const firstRecording = sortedRecordings[0];

  return {
    ...testRun,
    recordings,
    triggerUrl: firstRecording?.metadata?.source?.trigger?.url,
  };
}
