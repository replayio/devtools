import { useQuery } from "@apollo/client";
import { useContext } from "react";

import { GetTestForWorkspace_node_Workspace } from "shared/graphql/generated/GetTestForWorkspace";
import { TestExecution } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";

import { GET_TEST } from "../graphql/TestGraphQL";

export type ErrorFrequency = {
  executions: number;
  replays: number;
};

export function useTest(testId: string) {
  const { teamId } = useContext(TeamContext);
  const { data, loading, error } = useQuery<{ node: GetTestForWorkspace_node_Workspace }>(
    GET_TEST,
    {
      variables: { workspaceId: teamId, testId },
    }
  );

  const test = data?.node?.tests?.edges[0].node;

  if (loading || !test) {
    return { test: null, loading: true };
  }

  const processedTest = {
    ...test,
    failureRate: getFailureRate(test.executions),
    failureRates: getFailureRates(test.executions),
    errorFrequency: getErrorFrequency(test.executions),
  };

  return { test: processedTest, loading, error };
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
  return executions.reduce((acc: Record<string, ErrorFrequency>, e) => {
    if (e.result === "failed" && e.errors) {
      e.errors.forEach(errorMessage => {
        if (acc[errorMessage]) {
          acc[errorMessage] = {
            executions: acc[errorMessage].executions + 1,
            replays: e.recordings.length
              ? acc[errorMessage].replays + 1
              : acc[errorMessage].replays,
          };
        } else {
          acc[errorMessage] = { executions: 1, replays: e.recordings.length ? 1 : 0 };
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
