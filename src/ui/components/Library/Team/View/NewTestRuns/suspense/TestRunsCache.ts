import { createIntervalCache } from "suspense";

import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { TestRun, processTestRun } from "shared/test-suites/TestRun";
import { getTestRunsGraphQL } from "ui/components/Library/Team/View/TestRuns/graphql/TestRunsGraphQL";

export const testRunsIntervalCache = createIntervalCache<
  number,
  [graphQLClient: GraphQLClientInterface, accessToken: string | null, workspaceId: string],
  TestRun
>({
  debugLabel: "testRunsIntervalCache",
  getPointForValue: testRun => new Date(testRun.date).getTime(),
  load: async (start, end, graphQLClient, accessToken, workspaceId) => {
    let startTime: string | null = new Date(start).toISOString();
    let endTime: string | null = new Date(end).toISOString();
    if (start === 0 && end === 0) {
      startTime = null;
      endTime = null;
    }

    const rawTestRuns = await getTestRunsGraphQL(
      graphQLClient,
      accessToken,
      workspaceId,
      startTime,
      endTime
    );

    return rawTestRuns.map(processTestRun);
  },
});
