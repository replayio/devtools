import { createIntervalCache } from "suspense";
import { createCache } from "suspense";

import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Recording } from "shared/graphql/types";
import {
  TestRun,
  TestRunTest,
  TestRunTestWithRecordings,
  processTestRun,
} from "shared/test-suites/TestRun";
import {
  getTestRunTestsWithRecordingsGraphQL,
  getTestRunsGraphQL,
} from "ui/components/Library/Team/View/TestRuns/graphql/TestRunsGraphQL";
import { convertRecording } from "ui/hooks/recordings";
import { TestGroups, groupRecordings, testFailed, testPassed } from "ui/utils/testRuns";

export const testRunsIntervalCache = createIntervalCache<
  number,
  [graphQLClient: GraphQLClientInterface, accessToken: string | null, workspaceId: string],
  TestRun
>({
  debugLabel: "testRunsIntervalCache",
  getPointForValue: testRun => new Date(testRun.date).getTime(),
  load: async (start, end, graphQLClient, accessToken, workspaceId) => {
    const rawTestRuns = await getTestRunsGraphQL(
      graphQLClient,
      accessToken,
      workspaceId,
      new Date(start).toISOString(),
      new Date(end).toISOString()
    );

    return rawTestRuns.map(processTestRun);
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

        return {
          ...test,
          result: test.result as TestRunTest["result"],
          executions: test.executions.map(e => {
            const recs = e.recordings.map(convertRecording);
            recordings.push(...recs);

            // Adapt the execution status to convert "failed" execution status
            // to "flaky" when the test eventually passes
            let result = e.result;
            if (test.result === "flaky") {
              if (testFailed(e)) {
                result = "flaky";
              } else if (testPassed(e)) {
                result = "passed";
              }
            }

            return {
              result: result as TestRunTest["result"],
              recordings: recs,
            };
          }),
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
