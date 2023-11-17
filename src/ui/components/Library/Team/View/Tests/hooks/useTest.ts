import { useQuery } from "@apollo/client";
import { useContext, useMemo } from "react";

import {
  GetTestForWorkspace_node_Workspace_tests_edges_node_executions,
  GetTestForWorkspace_node_Workspace_tests_edges_node_executions_recordings,
} from "shared/graphql/generated/GetTestForWorkspace";
import { TestExecution } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";

import { GET_TEST } from "../graphql/TestGraphQL";

const EMPTY_OBJ: Record<any, any> = {};

export function useTest(testId: string) {
  const { teamId } = useContext(TeamContext);
  const { data, loading, error } = useQuery(GET_TEST, {
    variables: { workspaceId: teamId, testId },
  });

  const test = useMemo(() => {
    const rawTest = data?.node.tests.edges[0].node;

    if (loading || !data) {
      return EMPTY_OBJ;
    }

    return (
      {
        ...rawTest,
        executions: rawTest.executions.map(
          (e: GetTestForWorkspace_node_Workspace_tests_edges_node_executions) => ({
            ...e,
            recording: e.recordings.map(
              (
                r: GetTestForWorkspace_node_Workspace_tests_edges_node_executions_recordings | null
              ) => {
                if (!r) {
                  return r;
                }

                return { ...r, id: r.uuid };
              }
            ),
          })
        ),
      } ?? EMPTY_OBJ
    );
  }, [data, loading]);

  if (loading) {
    return { test: null, loading: true };
  }

  const processedTest = {
    ...test,
    failureRate: getFailureRate(test.executions),
    failureRates: getFailureRates(test.executions),
    errorFrequency: getErrorFrequency(test.executions),
  };

  return { test: processedTest, loading };
}
function getFailureRates(executions: TestExecution[]) {
  return {
    hour: getFailureRate(
      executions.filter(e => (Date.now() - new Date(e.createdAt).getTime()) / 1000 / 60 / 60 < 1)
    ),
    day: getFailureRate(
      executions.filter(
        e => (Date.now() - new Date(e.createdAt).getTime()) / 1000 / 60 / 60 / 24 < 1
      )
    ),
    week: getFailureRate(
      executions.filter(
        e => (Date.now() - new Date(e.createdAt).getTime()) / 1000 / 60 / 60 / 24 < 7
      )
    ),
    month: getFailureRate(
      executions.filter(
        e => (Date.now() - new Date(e.createdAt).getTime()) / 1000 / 60 / 60 / 24 < 30
      )
    ),
  };
}
function getErrorFrequency(executions: TestExecution[]) {
  return executions.reduce((acc: Record<string, number>, e) => {
    if (e.result === "failed" && e.errors) {
      e.errors.forEach(errorMessage => {
        if (acc[errorMessage]) {
          acc[errorMessage] = acc[errorMessage] + 1;
        } else {
          acc[errorMessage] = 1;
        }
      });
    }

    return acc;
  }, {});
}
function getFailureRate(executions: TestExecution[]) {
  if (!executions.length) {
    return 0;
  }

  return executions.filter(e => e.result === "failed").length / executions.length;
}
