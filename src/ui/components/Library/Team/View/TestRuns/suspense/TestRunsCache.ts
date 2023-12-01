import orderBy from "lodash/orderBy";
import { createCache } from "suspense";

import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Recording } from "shared/graphql/types";
import { TestRun, TestRunTestWithRecordings, processTestRun } from "shared/test-suites/TestRun";
import {
  getTestRunTestsWithRecordingsGraphQL,
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
  testRun: TestRun | null;
  durationMs: number;
  groupedTests: TestGroups | null;
  recordings: Recording[] | null;
  tests: TestRunTestWithRecordings[] | null;
};

export const testRunDetailsCache = createCache<
  [
    graphQLClient: GraphQLClientInterface,
    accessToken: string | null,
    workspaceId: string,
    testRunId: string
  ],
  TestRunRecordings
>({
  config: { immutable: true },
  debugLabel: "testRunDetailsCache",
  getKey: ([_, __, workspaceId, testRunId]) => `${workspaceId}:${testRunId}`,
  load: async ([graphQLClient, accessToken, workspaceId, testRunId]) => {
    const testRunNode = await getTestRunTestsWithRecordingsGraphQL(
      graphQLClient,
      accessToken,
      workspaceId,
      testRunId
    );

    const testRun = testRunNode ? processTestRun(testRunNode) : null;

    const recordings: Recording[] = [];
    let durationMs = 0;
    const testsWithRecordings =
      testRunNode?.tests.map<TestRunTestWithRecordings>(test => {
        durationMs += test.durationMs;
        const recs = orderBy(test.recordings.map(convertRecording), "date", "desc");
        recordings.push(...recs);

        return {
          ...test,
          recordings: recs,
        };
      }) ?? [];

    return {
      testRun,
      durationMs,
      groupedTests: groupRecordings(testsWithRecordings),
      tests: testsWithRecordings,
      recordings,
    };
  },
});
