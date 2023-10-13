import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext } from "react";

import { assert } from "protocol/utils";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { Recording } from "shared/graphql/types";
import { TestRun, TestRunTest } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { useTestRuns } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRuns";
import { testRunRecordingsCache } from "ui/components/Library/Team/View/TestRuns/suspense/TestRunsCache";
import { groupRecordings } from "ui/utils/testRuns";
import useToken from "ui/utils/useToken";

import { DashboardLayout } from "../../index";

// copied from useTestRunRecordingsSuspends.ts to skip the TestRunsContext dependency
function useTestRunRecordingsSuspends(testRuns: TestRun[], testRunId: string | null) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);

  const accessToken = useToken();

  if (testRunId) {
    const testRun = testRuns.find(t => t.id === testRunId);
    assert(testRun != null);

    return testRunRecordingsCache.read(graphQLClient, accessToken?.token ?? null, teamId, testRun);
  }

  return {
    groupedRecordings: null,
    recordings: null,
  };
}

function Panel(props: React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      {...props}
      className="flex w-0 flex-grow flex-col space-y-2 overflow-y-auto rounded-md bg-white p-4"
    />
  );
}

function TestRunRow({ teamId, testRun }: { teamId: string; testRun: TestRun }) {
  return (
    <Link href={`/dashboard/${teamId}/test-runs/${testRun.id}`} shallow>
      <div className="flex flex-row space-x-2">
        <div
          className={
            testRun.results.counts.failed === 0
              ? "w-8 text-center"
              : "w-8 rounded-md bg-red-500 text-center text-white"
          }
        >
          {testRun.results.counts.failed === 0 ? "✅" : testRun.results.counts.failed}
        </div>
        <div>{testRun.source?.prTitle || testRun.source?.commitTitle || "Test"}</div>
      </div>
    </Link>
  );
}

function TestGroup({
  result,
  testMap,
  teamId,
  testRunId,
}: {
  result: "passed" | "failed" | "flaky";
  testMap: Record<string, TestRunTest[]>;
  teamId: string;
  testRunId: string;
}) {
  const files = Object.keys(testMap);
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="py-2">
      <div>
        {files.length}{" "}
        {result === "failed" ? "Failed Tests" : result === "flaky" ? "Flaky Tests" : "Passed Tests"}
      </div>
      <div className="m-2 flex flex-col gap-2">
        {files.map(fileName => {
          const tests = testMap[fileName];
          return tests.map(t => {
            return (
              <Link href={`/dashboard/${teamId}/test-runs/${testRunId}/test/${t.testId}`}>
                <div className="flex flex-row gap-2">
                  <div>{result === "failed" ? "❌" : result === "flaky" ? "⚠️" : "✅"}</div>
                  <div className="flex-grow truncate">{t.title}</div>
                </div>
              </Link>
            );
          });
        })}
      </div>
    </div>
  );
}

function TestRunPanel({
  teamId,
  testRuns,
  testRunId,
}: {
  teamId: string;
  testRuns: TestRun[];
  testRunId: string;
}) {
  const testRun = testRuns.find(t => t.id === testRunId);
  assert(testRun != null);
  const { groupedRecordings } = useTestRunRecordingsSuspends(testRuns, testRunId);

  if (groupedRecordings == null) {
    return null;
  }

  const { passedRecordings, failedRecordings, flakyRecordings } = groupedRecordings;

  return (
    <div>
      <div>{testRun.source?.prTitle || testRun.source?.commitTitle || "Test"}</div>
      <div>Source control data</div>
      <TestGroup
        result="failed"
        testMap={failedRecordings.fileNameToTests}
        teamId={teamId}
        testRunId={testRunId}
      />
      <TestGroup
        result="flaky"
        testMap={flakyRecordings.fileNameToTests}
        teamId={teamId}
        testRunId={testRunId}
      />
      <TestGroup
        result="passed"
        testMap={passedRecordings.fileNameToTests}
        teamId={teamId}
        testRunId={testRunId}
      />
    </div>
  );
}

function TestPanel({
  testRuns,
  testRunId,
  testId,
}: {
  testRuns: TestRun[];
  testRunId: string;
  testId: string;
}) {
  const testRun = testRuns.find(t => t.id === testRunId);
  assert(testRun != null);

  const test = testRun.tests.find(t => t.testId === testId);
  assert(test != null);

  return (
    <div>
      <div>{test.title}</div>
    </div>
  );
}

function TestRun() {
  const testRuns = useTestRuns();
  const router = useRouter();
  const params = router.query.params;
  const teamId = Array.isArray(router.query.team) ? router.query.team[0] : router.query.team!;
  const testRunParams = Array.isArray(params) ? params : params ? [params] : [];
  const [testRunId, _view, testId] = testRunParams;

  return (
    <div className="flex flex-grow flex-row space-x-2 p-2">
      <Panel>
        {testRuns.map(r => (
          <TestRunRow teamId={router.query.team as string} testRun={r} />
        ))}
      </Panel>
      <Panel>
        {testRunId ? (
          <TestRunPanel testRuns={testRuns} testRunId={testRunId} teamId={teamId} />
        ) : (
          <div>Select a run to see its details here</div>
        )}
      </Panel>
      <Panel>
        {testRunId && testId ? (
          <TestPanel testRuns={testRuns} testRunId={testRunId} testId={testId} />
        ) : null}
      </Panel>
    </div>
  );
}

export default function TestRunPage() {
  return (
    <DashboardLayout>
      <TestRun />
    </DashboardLayout>
  );
}
