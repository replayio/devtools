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
import { TestGroups, groupRecordings, testFailed, testPassed } from "ui/utils/testRuns";

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

        return {
          ...test,
          executions: test.executions.map(e => {
            const recs = e.recordings.map(convertRecording);
            recordings.push(...recs);

            let result = e.result;
            if (test.result === "flaky") {
              if (testFailed(e)) {
                result = "flaky";
              } else if (testPassed(e)) {
                result = "passed";
              }
            }

            return {
              result,
              recordings: recs,
            };
          }),
        };
      }) ?? [];

    return {
      testRun,
      durationMs,
      groupedTests: groupRecordings(testsWithRecordings),
      recordings,
    };
  },
});
