import { createCache } from "suspense";

import {
  GetWorkspaceTests,
  GetWorkspaceTests_node_Workspace,
} from "shared/graphql/generated/GetWorkspaceTests";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Test } from "shared/test-suites/TestRun";

import { GET_WORKSPACE_TESTS } from "../graphql/TestGraphQL";

// We don't have any good way like (Test.created_at) to sort tests, therefore we can't properly build query ranges,
// therefore can't use createIntervalCache
export const testsCache = createCache<
  [
    graphQLClient: GraphQLClientInterface,
    accessToken: string | null,
    workspaceId: string,
    startTime: Date,
    endTime: Date
  ],
  Test[]
>({
  config: { immutable: true },
  debugLabel: "testsCache",
  // endTime will keep on changing, so we need to snap it to a two minute window
  getKey: ([_, __, workspaceId, startTime, endTime]) =>
    `${workspaceId}:${startTime.getTime()}:${snapToTwoMinuteWindow(endTime).getTime()}`,
  load: async ([graphQLClient, accessToken, workspaceId, startTime, endTime]) => {
    const response = await graphQLClient.send<GetWorkspaceTests>(
      {
        operationName: "GetWorkspaceTests",
        query: GET_WORKSPACE_TESTS,
        variables: { workspaceId, startTime, endTime },
      },
      accessToken
    );

    const rawTests =
      (response?.node as GetWorkspaceTests_node_Workspace)?.tests?.edges.map(edge => edge.node) ??
      [];

    return rawTests.map(t => ({
      ...t,
      failureRate: t.stats.failureRate,
      flakyRate: t.stats.flakyRate,
    }));
  },
});

const snapToTwoMinuteWindow = (date: Date, windowSizeInMinutes = 2) => {
  const millisecondsInMinute = 60 * 1000;
  const totalMilliseconds = date.getTime();
  const totalMinutes = totalMilliseconds / millisecondsInMinute;
  const roundedMinutes = Math.round(totalMinutes / windowSizeInMinutes) * windowSizeInMinutes;
  const newTotalMilliseconds = roundedMinutes * millisecondsInMinute;
  const snappedDate = new Date(newTotalMilliseconds);
  return snappedDate;
};
