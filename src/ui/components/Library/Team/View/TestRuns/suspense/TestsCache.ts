import orderBy from "lodash/orderBy";
import { createCache } from "suspense";

import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Test } from "shared/test-suites/TestRun";

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

    // TODO SCS-1575
    const processedTests = rawTests.map(t => ({
      ...t,
    }));

    return orderBy(processedTests, "failureRate", "desc");
  },
});
