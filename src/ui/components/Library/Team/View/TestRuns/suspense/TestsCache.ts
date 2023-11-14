import orderBy from "lodash/orderBy";
import { createCache } from "suspense";

import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Test, TestExecution } from "shared/test-suites/TestRun";

import { getTestsGraphQL } from "../../Tests/graphql/TestsGraphQL";

export const testsCache = createCache<
  [graphQLClient: GraphQLClientInterface, accessToken: string | null, workspaceId: string],
  Test[]
>({
  config: { immutable: true },
  debugLabel: "testsCache",
  getKey: ([_, __, workspaceId]) => workspaceId,
  load: async ([graphQLClient, accessToken, workspaceId]) => {
    const rawTests = await getTestsGraphQL(graphQLClient, accessToken, workspaceId);

    // Compute the failure rate and add it to the stored test in cache
    // until we're able to do it from the backend
    const processedTests = rawTests.map(t => ({
      ...t,
      failureRate: getFailureRate(t.executions),
      failureRates: getFailureRates(t.executions),
      errorFrequency: getErrorFrequency(t.executions),
    }));

    return orderBy(processedTests, "failureRate", "desc");
  },
});

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
