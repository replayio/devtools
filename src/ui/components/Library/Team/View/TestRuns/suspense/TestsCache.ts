import orderBy from "lodash/orderBy";
import { createCache } from "suspense";

import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { TestRun, processTestRun } from "shared/test-suites/TestRun";
import {
  getTestRunsGraphQL,
} from "ui/components/Library/Team/View/TestRuns/graphql/TestRunsGraphQL";
import { getTestsGraphQL } from "../../Tests/graphql/TestsGraphQL";

export const testsCache = createCache<
  [graphQLClient: GraphQLClientInterface, accessToken: string | null, workspaceId: string],
  TestRun[]
>({
  config: { immutable: true },
  debugLabel: "testRunsCache",
  getKey: ([_, __, workspaceId]) => workspaceId,
  load: async ([graphQLClient, accessToken, workspaceId]) => {
    const rawTests = await getTestsGraphQL(graphQLClient, accessToken, workspaceId);
    console.log({rawTests});

    // const tests = rawTests.map(processTests);

    return orderBy(rawTests, "date", "desc");
  },
});

// export function processTests(test: any): any {
//   const { mode, results, ...rest } = testRun;

//   return {
//     ...rest,
//     mode: mode as Mode | null,
//     results,
//   };
// }