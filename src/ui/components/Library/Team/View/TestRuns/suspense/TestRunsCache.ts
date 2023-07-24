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
import { RecordingGroups, groupRecordings } from "ui/utils/testRuns";

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
  groupedRecordings: RecordingGroups | null;
  recordings: Recording[] | null;
};

export const testRunRecordingsCache = createCache<
  [
    graphQLClient: GraphQLClientInterface,
    accessToken: string | null,
    workspaceId: string,
    summaryId: string
  ],
  TestRunRecordings
>({
  config: { immutable: true },
  debugLabel: "testRunRecordingsCache",
  getKey: ([_, __, workspaceId, summaryId]) => `${workspaceId}:${summaryId}`,
  load: async ([graphQLClient, accessToken, workspaceId, summaryId]) => {
    const rawRecordings = await getTestRunRecordingsGraphQL(
      graphQLClient,
      accessToken,
      workspaceId,
      summaryId
    );

    const recordings = rawRecordings.map(convertRecording);

    return {
      groupedRecordings: groupRecordings(recordings),
      recordings,
    };
  },
});
