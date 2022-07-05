import { gql, useQuery } from "@apollo/client";
import orderBy from "lodash/orderBy";
import { WorkspaceId } from "ui/state/app";
import { Recording, SourceCommit } from "ui/types";

export interface Test {
  title: string;
  path: string[];
  date: string;
  recordings: Recording[];
}

export interface TestRunStats {
  passed: number;
  failed: number;
}
export interface TestRun {
  id: string;
  commitTitle: string;
  commitId: string;
  mergeTitle: string;
  mergeId: string;
  user: string;
  date: string;
  branch: string;
  stats: TestRunStats;
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
          branch
          commitId
          commitTitle
          mergeId
          mergeTitle
          user
          date
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
          id
          branch
          commitId
          commitTitle
          mergeId
          mergeTitle
          user
          date
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

function unwrapRecordingsData(recordings: any): Recording[] {
  return recordings.edges.map((e: any) => ({
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
  const { data, loading } = useQuery(GET_TEST, {
    variables: { path: serializedPath, workspaceId },
  });

  if (loading) {
    return { test: null, loading };
  }

  return {
    test: convertTest(data.node.tests[0]),
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
  const { data, loading } = useQuery(GET_TEST_RUN, {
    variables: { id: testRunId, workspaceId },
  });

  if (loading) {
    return { testRun: null, loading };
  }

  const testRun = data.node.testRuns[0];

  return {
    testRun: convertTestRun(testRun),
    loading,
  };
}

export function useGetTestsForWorkspace(workspaceId: WorkspaceId): {
  tests: Test[] | null;
  loading: boolean;
} {
  const { data, loading } = useQuery(GET_TESTS_FOR_WORKSPACE, {
    variables: { workspaceId },
  });

  if (loading) {
    return { tests: null, loading };
  }

  const tests = data.node.tests.map(convertTest);
  const sortedTests = orderBy(tests, ["date"], ["desc"]);

  return {
    tests: sortedTests,
    loading,
  };
}

function convertTest(test: Test) {
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
  const { data, loading } = useQuery(GET_TEST_RUNS_FOR_WORKSPACE, {
    variables: { workspaceId },
  });

  if (loading) {
    return { testRuns: null, loading };
  }

  const testRuns = data.node.testRuns.map(convertTestRun);
  const sortedTestRuns = orderBy(testRuns, "date", "desc");

  return {
    testRuns: sortedTestRuns,
    loading,
  };
}

function convertTestRun(testRun: any) {
  const recordings = testRun.recordings ? unwrapRecordingsData(testRun.recordings) : [];
  const sortedRecordings = orderBy(recordings, "date", "desc");
  const firstRecording = sortedRecordings[0];

  return {
    ...testRun,
    recordings,
    triggerUrl: firstRecording?.metadata?.source?.trigger?.url,
  };
}
