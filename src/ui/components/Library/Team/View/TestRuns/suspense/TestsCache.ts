import orderBy from "lodash/orderBy";
import { createCache } from "suspense";

import { GetTestPreviewsForWorkspace_node_Workspace_tests_edges_node_stats } from "shared/graphql/generated/GetTestPreviewsForWorkspace";
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
      failureRate: generateFailureRate(t.stats),
    }));

    return orderBy(processedTests, "failureRate", "desc");
  },
});

function generateFailureRate(
  stats: GetTestPreviewsForWorkspace_node_Workspace_tests_edges_node_stats
) {
  const { passed, failed, flaky, skipped, unknown } = stats;
  const total = passed + failed + flaky + skipped + unknown;

  return failed / total;
}
