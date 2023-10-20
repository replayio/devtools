import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext } from "react";

import { assert } from "protocol/utils";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { formatRelativeTime } from "replay-next/src/utils/time";
import { TestRun, TestRunTest } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { useTestRuns } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRuns";
import { testRunRecordingsCache } from "ui/components/Library/Team/View/TestRuns/suspense/TestRunsCache";
import useToken from "ui/utils/useToken";

import { DashboardLayout, Panel } from "../../index";

function Message(props: React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      {...props}
      className="m-auto rounded-md bg-gray-200 p-2 text-center"
      style={{ width: 180 }}
    />
  );
}

function useDashboardQueryParams() {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  const router = useRouter();
  const teamId = first(router.query.team);
  const [testRunId = null, _view, testId = null] = router.query.params || [];

  return {
    teamId,
    testRunId,
    testId,
  };
}

function getTestRunTitle(testRun: TestRun) {
  return testRun.source?.prTitle || testRun.source?.commitTitle || "Test";
}

// copied from useTestRunRecordingsSuspends.ts to skip the TestRunsContext dependency
function useTestRunRecordingsSuspends(testRuns: TestRun[], testRunId: string | null) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);

  const accessToken = useToken();

  if (testRunId && testRuns.length > 0) {
    const testRun = testRuns.find(t => t.id === testRunId);
    assert(testRun != null);

    return testRunRecordingsCache.read(graphQLClient, accessToken?.token ?? null, teamId, testRun);
  }

  return {
    groupedRecordings: null,
    recordings: null,
  };
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
        <div className="flex-grow">{getTestRunTitle(testRun)}</div>
        <div>{formatRelativeTime(new Date(testRun.date))}</div>
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
        {`${files.length} ${
          result === "failed" ? "Failed Tests" : result === "flaky" ? "Flaky Tests" : "Passed Tests"
        }`}
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

function TestRunPanel({ testRuns }: { testRuns: TestRun[] }) {
  const { teamId, testRunId } = useDashboardQueryParams();
  const { groupedRecordings } = useTestRunRecordingsSuspends(testRuns, testRunId);

  if (!teamId || !testRunId) {
    return <Message>Select a run to see its details here</Message>;
  }

  if (groupedRecordings == null) {
    return null;
  }

  const testRun = testRuns.find(t => t.id === testRunId);
  assert(testRun != null);
  const { passedRecordings, failedRecordings, flakyRecordings } = groupedRecordings;

  return (
    <div>
      <h2 className="pb-2 pt-4 text-xl">{getTestRunTitle(testRun)}</h2>
      <div
        className="m-2 grid grid-flow-row gap-2"
        style={{
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gridTemplateRows: "repeat(2, minmax(0, 1fr))",
        }}
      >
        <div className="truncate">{formatRelativeTime(new Date(testRun.date))}</div>
        <div className="truncate">{testRun.source?.user}</div>
        <div className="truncate">{testRun.source?.branchName}</div>
        <div className="truncate">duration</div>
        <div className="truncate">{testRun.source?.prNumber}</div>
        <div className="truncate">
          {testRun.source?.triggerUrl ? <a href={testRun.source?.triggerUrl}>Workflow</a> : null}
        </div>
      </div>
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

function TestPanel({ testRuns }: { testRuns: TestRun[] }) {
  const { testRunId, testId } = useDashboardQueryParams();

  if (!testRunId || !testId || testRuns.length === 0) {
    return testRunId ? <Message>Select a test to see its details here</Message> : null;
  }

  const testRun = testRuns.find(t => t.id === testRunId);
  assert(testRun != null);

  const test = testRun.tests.find(t => t.testId === testId);
  assert(test != null);

  return (
    <div>
      <div>{test.title}</div>
      {test.error ? (
        <>
          <h2 className="pb-2 pt-4 text-xl">Errors</h2>
          <div className="rounded-md bg-gray-200 p-3">
            <div className="h-32 overflow-hidden pl-3 " style={{ borderLeft: "2px solid red" }}>
              {test.error}
            </div>
          </div>
        </>
      ) : null}
      <h2 className="pb-2 pt-4 text-xl">Recent replays of this test</h2>
      <p>Needs the new tests graphql endpoint to fetch tests by testId: {test.testId}</p>
    </div>
  );
}

function TestRun() {
  const testRuns = useTestRuns();
  const router = useRouter();

  return (
    <div className="flex flex-grow flex-row space-x-2 p-2">
      <Panel>
        {testRuns.map(r => (
          <TestRunRow teamId={router.query.team as string} testRun={r} />
        ))}
      </Panel>
      <Panel>
        <TestRunPanel testRuns={testRuns} />
      </Panel>
      <Panel>
        <TestPanel testRuns={testRuns} />
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
