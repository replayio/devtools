import * as crypto from "crypto";
import axios from "axios";

import config from "../config";

interface TestRunShardInputModel {
  runnerName: string;
  runnerVersion: string;
  repository: string | null;
  title: string | null;
  mode: string | null;
  branch: string | null;
  pullRequestId: string | null;
  pullRequestTitle: string | null;
  commitId: string | null;
  commitTitle: string | null;
  commitUser: string | null;
  triggerUrl: string | null;
  triggerUser: string | null;
  triggerReason: string | null;
}

interface TestRunTestInputModel {
  testId: string;
  runnerGroupId: string | null;
  index: number;
  attempt: number;
  scope: string[];
  title: string;
  sourcePath: string;
  result: string;
  error: string | null;
  duration: number;
  recordingIds: string[];
}

export const testRunStates = {
  SINGLE_TEST: {
    runnerName: "playwright",
    runnerVersion: "1.0.0",
    repository: null,
    title: null,
    mode: null,
    branch: null,
    pullRequestId: null,
    pullRequestTitle: null,
    commitId: null,
    commitTitle: "This run has a single test",
    commitUser: null,
    triggerUrl: null,
    triggerUser: null,
    triggerReason: null,
    tests: [
      {
        testId: "single-test-id",
        runnerGroupId: null,
        index: 0,
        attempt: 0,
        scope: [],
        title: "The one and only test",
        sourcePath: "test.ts",
        result: "passed",
        error: null,
        duration: 100,
        recordingIds: ["51ee9a7d-1599-4ceb-9237-6b07e9db6264"],
      },
    ],
  },
};

async function startTestRunShard(
  clientKey: string,
  testRun: TestRunShardInputModel
): Promise<{
  shard: string;
  clientKey: string;
}> {
  if (!process.env.GOLDEN_TEST_RUN_WORKSPACE_API_KEY) {
    throw new Error("GOLDEN_TEST_RUN_WORKSPACE_API_KEY must be set in order to setup test runs.");
  }

  const resp =
    (
      await axios({
        url: config.graphqlUrl,
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GOLDEN_TEST_RUN_WORKSPACE_API_KEY}`,
        },
        data: {
          query: `
          mutation CreateTestRunShard($clientKey: String!, $testRun: TestRunShardInput!) {
            startTestRunShard(input: {
              clientKey: $clientKey,
              testRun: $testRun
            }) {
              success
              testRunShardId
            }
          }
        `,
          variables: {
            clientKey,
            testRun: {
              runnerName: testRun.runnerName,
              runnerVersion: testRun.runnerVersion,
              repository: testRun.repository,
              title: testRun.title,
              mode: testRun.mode,
              branch: testRun.branch,
              pullRequestId: testRun.pullRequestId,
              pullRequestTitle: testRun.pullRequestTitle,
              commitId: testRun.commitId,
              commitTitle: testRun.commitTitle + " " + clientKey,
              commitUser: testRun.commitUser,
              triggerUrl: testRun.triggerUrl,
              triggerUser: testRun.triggerUser,
              triggerReason: testRun.triggerReason,
            },
          },
        },
      })
    )?.data ?? {};

  if (resp.errors) {
    resp.errors.forEach((e: any) => console.error("GraphQL error start test shard: %o", e));
    throw new Error("Failed to start a new test run");
  }

  const testRunShardId = resp.data.startTestRunShard.testRunShardId;

  if (!testRunShardId) {
    throw new Error("Unexpected error retrieving test run shard id");
  }

  return { shard: testRunShardId, clientKey };
}

async function addTestsToShard(
  shard: string,
  clientKey: string,
  tests: TestRunTestInputModel[]
): Promise<boolean> {
  const resp =
    (
      await axios({
        url: config.graphqlUrl,
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GOLDEN_TEST_RUN_WORKSPACE_API_KEY}`,
        },

        data: {
          query: `
          mutation AddTestsToShard($testRunShardId: String!, $tests: [TestRunTestInputType!]!) {
            addTestsToShard(input: {
              testRunShardId: $testRunShardId,
              tests: $tests
            }) {
              success
            }
          }
        `,
          variables: {
            testRunShardId: shard,
            tests: tests.map(t => ({
              ...t,
              title: t.title + " " + clientKey,
            })),
          },
        },
      })
    )?.data ?? {};

  if (resp.errors) {
    resp.errors.forEach((e: any) => console.error("GraphQL error adding tests to shard: %o", e));
    throw new Error("Unexpected error adding tests to run");
  }

  return true;
}

async function completeTestRunShard(shard: string): Promise<boolean> {
  const resp =
    (
      await axios({
        url: config.graphqlUrl,
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GOLDEN_TEST_RUN_WORKSPACE_API_KEY}`,
        },

        data: {
          query: `
          mutation CompleteTestRunShard($testRunShardId: String!) {
            completeTestRunShard(input: {
              testRunShardId: $testRunShardId
            }) {
              success
            }
          }
        `,
          variables: {
            testRunShardId: shard,
          },
        },
      })
    )?.data ?? {};

  if (resp.errors) {
    resp.errors.forEach((e: any) => console.error("GraphQL error completing test shard: %o", e));
    throw new Error("Unexpected error completing test run shard");
  }

  return true;
}

export async function setupTestRun(
  state: keyof typeof testRunStates,
  clientKey: string
): Promise<boolean> {
  if (!process.env.GOLDEN_TEST_RUN_WORKSPACE_API_KEY) {
    throw new Error("GOLDEN_TEST_RUN_WORKSPACE_API_KEY must be set in order to setup test runs.");
  }

  const { shard } = await startTestRunShard(clientKey, testRunStates[state]);

  await addTestsToShard(shard, clientKey, testRunStates[state].tests);
  await completeTestRunShard(shard);

  return true;
}
