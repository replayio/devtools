import orderBy from "lodash/orderBy";
import { createCache } from "suspense";

import {
  GetWorkspaceTests,
  GetWorkspaceTests_node_Workspace,
} from "shared/graphql/generated/GetWorkspaceTests";
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
    const response = await graphQLClient.send<GetWorkspaceTests>(
      {
        operationName: "GetWorkspaceTests",
        query: GET_WORKSPACE_TESTS,
        variables: { workspaceId },
      },
      accessToken
    );

    const rawTests =
      (response?.node as GetWorkspaceTests_node_Workspace)?.tests?.edges.map(edge => edge.node) ??
      [];

    const processedTests = rawTests.map(t => ({
      ...t,
      failureRate: t.stats.failureRate,
    }));

    return orderBy(processedTests, "failureRate", "desc");
  },
});
