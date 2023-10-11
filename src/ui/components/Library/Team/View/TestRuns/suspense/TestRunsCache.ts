import orderBy from "lodash/orderBy";
import { createCache } from "suspense";

import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Recording } from "shared/graphql/types";
import { TestRun, processTestRun } from "shared/test-suites/TestRun";
import {
  getTestRunRecordingsGraphQL,
  getTestRunsGraphQL,
} from "ui/components/Library/Team/View/TestRuns/graphql/TestRunsGraphQL";
import { convertRecording } from "ui/hooks/recordings";
import { TestGroups, groupRecordings } from "ui/utils/testRuns";

export const testRunsCache = createCache<
  [graphQLClient: GraphQLClientInterface, accessToken: string | null, workspaceId: string],
  TestRun[]
>({
  config: { immutable: true },
  debugLabel: "testRunsCache",
  getKey: ([_, __, workspaceId]) => workspaceId,
  load: async ([graphQLClient, accessToken, workspaceId]) => {
    const rawTestRuns = await getTestRunsGraphQL(graphQLClient, accessToken, workspaceId);

    const testRuns = rawTestRuns.map(processTestRun);

    return orderBy(testRuns, "date", "desc");
  },
});

export type TestRunRecordings = {
  groupedRecordings: TestGroups | null;
  recordings: Recording[] | null;
};

export const testRunRecordingsCache = createCache<
  [
    graphQLClient: GraphQLClientInterface,
    accessToken: string | null,
    workspaceId: string,
    testRun: TestRun
  ],
  TestRunRecordings
>({
  config: { immutable: true },
  debugLabel: "testRunRecordingsCache",
  getKey: ([_, __, workspaceId, testRun]) => `${workspaceId}:${testRun.id}`,
  load: async ([graphQLClient, accessToken, workspaceId, testRun]) => {
    const rawRecordings = await getTestRunRecordingsGraphQL(
      graphQLClient,
      accessToken,
      workspaceId,
      testRun.id
    );

    const recordings = rawRecordings.map(convertRecording);

    return {
      groupedRecordings: groupRecordings(recordings, testRun.tests),
      recordings,
    };
  },
});
