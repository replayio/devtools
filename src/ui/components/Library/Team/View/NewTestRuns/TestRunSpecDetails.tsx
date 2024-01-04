import { useContext } from "react";

import Icon from "replay-next/components/Icon";
import { TestRunTestWithRecordings } from "shared/test-suites/TestRun";

import { Alert } from "../shared/Alert";
import { useTestRunDetailsSuspends } from "../TestRuns/hooks/useTestRunDetailsSuspends";
import { TestSuitePanelMessage } from "../TestSuitePanelMessage";
import { TestRunPanelWrapper } from "./TestRunPanelWrapper";
import { TestRunResultList } from "./TestRunResultList";
import { TestRunsContext } from "./TestRunsContextRoot";

export function TestRunSpecDetails() {
  const { spec, filterTestsByText } = useContext(TestRunsContext);
  const { testRunId, testRuns } = useContext(TestRunsContext);

  const { groupedTests, tests, testRun } = useTestRunDetailsSuspends(testRunId);
  const selectedSpecTests =
    // Select tests that not filtered in second panel
    tests
      ?.filter(
        t => filterTestsByText === "" || t.sourcePath.toLowerCase().includes(filterTestsByText)
      )
      ?.filter((t: any) => t.sourcePath === spec) ?? [];
  const selectedTest = selectedSpecTests?.[0];

  if (
    !spec ||
    groupedTests === null ||
    selectedTest == null ||
    !testRuns.some(t => t.id === testRunId)
  ) {
    return (
      <TestSuitePanelMessage data-test-id="NoTestSelected">
        Select a test to see its details here
      </TestSuitePanelMessage>
    );
  }

  const failedTests = selectedSpecTests.filter(t => t.result === "failed" || t.result === "flaky");

  return (
    <TestRunPanelWrapper>
      <div className="flex flex-grow flex-col gap-3 overflow-y-auto py-3">
        <div className="flex flex-col gap-2 px-3">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-semibold">
            Replays
          </div>
          <TestRunResultList selectedSpecTests={selectedSpecTests} />
        </div>
        {failedTests.length ? <Errors failedTests={failedTests} /> : null}
      </div>
    </TestRunPanelWrapper>
  );
}

function Errors({ failedTests }: { failedTests: TestRunTestWithRecordings[] }) {
  return (
    <div className="flex flex-col gap-2 px-3">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-semibold">
        Errors
      </div>
      {failedTests.map(t =>
        t.errors?.map((e, i) => (
          <div
            key={`${t.id}-${i}`}
            data-test-id="TestRunSpecDetails-Error"
            className="w-full overflow-x-auto rounded-md bg-[color:var(--testsuites-v2-error-bg)] px-3 py-4"
          >
            <div className="flex flex-col gap-4 whitespace-pre-wrap break-words border-l-2 border-[color:var(--testsuites-v2-failed-header)] px-3">
              <div className="font-mono text-xs">{e.split("\n").slice(0, 4).join("\n")}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
