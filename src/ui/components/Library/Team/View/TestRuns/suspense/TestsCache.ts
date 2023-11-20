import orderBy from "lodash/orderBy";
import { createCache } from "suspense";

import {
  GetTestPreviewsForWorkspace,
  GetTestPreviewsForWorkspace_node_Workspace,
  GetTestPreviewsForWorkspace_node_Workspace_tests_edges_node_stats,
} from "shared/graphql/generated/GetTestPreviewsForWorkspace";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Test } from "shared/test-suites/TestRun";

import { GET_WORKSPACE_TESTS } from "../../Tests/graphql/TestGraphQL";

export const testsCache = createCache<
  [graphQLClient: GraphQLClientInterface, accessToken: string | null, workspaceId: string],
  Test[]
>({
  config: { immutable: true },
  debugLabel: "testsCache",
  getKey: ([_, __, workspaceId]) => workspaceId,
  load: async ([graphQLClient, accessToken, workspaceId]) => {
    const response = await graphQLClient.send<GetTestPreviewsForWorkspace>(
      {
        operationName: "GetTestPreviewsForWorkspace",
        query: GET_WORKSPACE_TESTS,
        variables: { workspaceId },
      },
      accessToken
    );

    const rawTests =
      (response?.node as GetTestPreviewsForWorkspace_node_Workspace)?.tests?.edges.map(
        edge => edge.node
      ) ?? [];

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
  const { passed, failed, flaky } = stats;
  const total = passed + failed + flaky;

  return failed / total;
}
