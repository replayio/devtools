import { useQuery } from "@apollo/client";
import { useContext } from "react";
import { useImperativeCacheValue } from "suspense";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import {
  GetTestForWorkspace_node_Workspace_tests_edges_node_executions,
  GetTestForWorkspace_node_Workspace_tests_edges_node_executions_recording,
} from "shared/graphql/generated/GetTestForWorkspace";
import { Test, TestExecution } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import useToken from "ui/utils/useToken";

import { testsCache } from "../../TestRuns/suspense/TestsCache";
import { GET_TEST } from "../graphql/TestsGraphQL";

const EMPTY_ARRAY: any[] = [];

export function useTests(): Test[] {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);

  const accessToken = useToken();

  const { value = EMPTY_ARRAY } = useImperativeCacheValue(
    testsCache,
    graphQLClient,
    accessToken?.token ?? null,
    teamId
  );
  return value;
}

export function useTest(testId: string) {
  const { teamId } = useContext(TeamContext);
  const { data, loading } = useQuery(GET_TEST, {
    variables: { workspaceId: teamId, testId },
  });

  if (loading) {
    return { test: null, loading: true };
  }
  const test =
    {
      ...data.node.tests.edges[0].node,
      executions: data.node.tests.edges[0].node.executions.map(
        (e: GetTestForWorkspace_node_Workspace_tests_edges_node_executions) => ({
          ...e,
          recording: e.recording.map(
            (
              r: GetTestForWorkspace_node_Workspace_tests_edges_node_executions_recording | null
            ) => {
              if (!r) {
                return r;
              }

              return { ...r, id: r.uuid };
            }
          ),
        })
      ),
    } ?? {};

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
    let newAcc = { ...acc };

    if (e.result === "failed" && e.errors) {
      e.errors.forEach(errorMessage => {
        if (newAcc[errorMessage]) {
          newAcc[errorMessage] = newAcc[errorMessage] + 1;
        } else {
          newAcc[errorMessage] = 1;
        }
      });
    }

    return newAcc;
  }, {});
}

function getFailureRate(executions: TestExecution[]) {
  if (!executions.length) {
    return 0;
  }

  return executions.filter(e => e.result === "failed").length / executions.length;
}
