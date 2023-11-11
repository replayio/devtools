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
  debugLabel: "testsCache",
  getKey: ([_, __, workspaceId]) => workspaceId,
  load: async ([graphQLClient, accessToken, workspaceId]) => {

    const rawTests = await getTestsGraphQL(graphQLClient, accessToken, workspaceId);
    
    // Compute the failure rate and add it to the stored test in cache
    // until we're able to do it from the backend
    const processedTests = rawTests.map(t => ({
      ...t,
      failureRate: t.executions.filter(e => e.result === "failed").length / t.executions.length
    }))

    // const tests = rawTests.map(processTests);

    return orderBy(processedTests, "failureRate", "desc");
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
