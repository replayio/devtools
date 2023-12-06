import { useContext } from "react";

import Icon from "replay-next/components/Icon";
import { TestRunTestWithRecordings } from "shared/test-suites/TestRun";

import { useTestRunDetailsSuspends } from "../TestRuns/hooks/useTestRunDetailsSuspends";
import { TestResultListItem } from "./Overview/TestResultListItem";
import { TestRunsContext } from "./TestRunsContextRoot";
import styles from "../../../Testsuites.module.css";

export function TestRunSpecDetails() {
  const { spec, filterTestsByText } = useContext(TestRunsContext);
  const { testRunId } = useContext(TestRunsContext);

  const { groupedTests, tests, testRun } = useTestRunDetailsSuspends(testRunId);
  const selectedSpecTests =
    // Select tests that not filtered in second panel
    tests
      ?.filter(
        t => filterTestsByText === "" || t.sourcePath.toLowerCase().includes(filterTestsByText)
      )
      ?.filter((t: any) => t.sourcePath === spec) ?? [];
  const selectedTest = selectedSpecTests?.[0];

  if (!spec) {
    return (
      <div className="flex h-full w-full items-center justify-center p-2">
<div className={styles.standardMessaging}>Select a test to see its details here</div>
      </div>
    );
  } else if (groupedTests === null || selectedTest == null) {
    return null;
  }

  const failedTests = selectedSpecTests.filter(t => t.result === "failed" || t.result === "flaky");

  return (
    <div className="flex h-full w-full flex-col justify-start text-sm">
      <div className="mt-10 flex flex-grow flex-col gap-3 overflow-y-auto border-t border-themeBorder py-3">
        <div className="flex flex-col gap-2 px-3">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-semibold">
            Replays
          </div>
          <div className="flex flex-col gap-2">
            {selectedSpecTests.map(s =>
              s.executions
                .filter(e => e.recordings.length > 0)
                .flatMap(execution =>
                  execution.recordings.map(r => (
                    <TestResultListItem
                      depth={1}
                      key={r.id}
                      label={execution.result}
                      recording={r}
                      testRun={testRun}
                      test={s}
                    />
                  ))
                )
            )}
          </div>
        </div>
        {failedTests.length ? <Errors failedTests={failedTests} /> : null}
      </div>
    </div>
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
            className="w-full overflow-x-auto rounded-md bg-[color:var(--testsuites-v2-error-bg)] px-3 py-4"
          >
            <div className="flex flex-col gap-4 whitespace-pre-wrap break-words border-l-2 border-[color:var(--testsuites-v2-failed-header)] px-3">
              <div className="mb-2 flex cursor-default select-none flex-row items-center gap-2 text-[color:var(--testsuites-v2-failed-header)]">
                <Icon type="warning" className="h-4 w-4" />
                <span className="font-monospace text-xs">Error</span>
              </div>
              <div className="font-mono text-xs text-[color:var(--primary-accent-foreground-text)]">
                {e.split("\n").slice(0, 4).join("\n")}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
