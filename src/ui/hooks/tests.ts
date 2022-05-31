import { gql, useQuery } from "@apollo/client";
import { WorkspaceId } from "ui/state/app";
import { Recording } from "ui/types";

export interface Test {
  title: string;
  path: string[];
  recordings: Recording[];
}
export interface TestRun {
  id: string;
  recordings: Recording[];
  createdAt: string;
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

const GET_TEST = gql`
  query GetTest($path: String!) {
    test(path: $path) {
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
`;
const GET_TEST_RUN = gql`
  query GetTest($id: String!) {
    testRun(id: $id) {
      id
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
`;

function unwrapRecordingsData(recordings: any): Recording[] {
  return recordings.edges.map((e: any) => ({
    ...e.node,
    id: e.node.uuid,
    date: e.node.createdAt,
  }));
}

export function useGetTest(path: string[]): { test: Test | null; loading: boolean } {
  const serializedPath = encodeURIComponent(JSON.stringify(path));
  const { data, loading } = useQuery(GET_TEST, {
    variables: { path: serializedPath, test: false },
  });

  if (loading) {
    return { test: null, loading };
  }

  return {
    test: {
      ...data.test,
      recordings: unwrapRecordingsData(data.test.recordings),
    },
    loading,
  };
}

export function useGetTestRun(id: string): { testRun: TestRun | null; loading: boolean } {
  const { data, loading } = useQuery(GET_TEST_RUN, {
    variables: { id },
  });

  if (loading) {
    return { testRun: null, loading };
  }

  return {
    testRun: {
      ...data.testRun,
      recordings: unwrapRecordingsData(data.testRun.recordings),
    },
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

  return {
    tests: data.node.tests.map((t: any) => ({
      ...t,
      recordings: unwrapRecordingsData(t.recordings),
    })),
    loading,
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

  return {
    testRuns: data.node.testRuns.map((t: any) => ({
      ...t,
      recordings: unwrapRecordingsData(t.recordings),
    })),
    loading,
  };
}
