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
    const rawTestRuns = await getTestRunsGraphQL(
      graphQLClient,
      accessToken,
      workspaceId,
      new Date(start).toISOString(),
      new Date(end).toISOString()
    );

    return rawTestRuns.map(processTestRun);
  },
});
