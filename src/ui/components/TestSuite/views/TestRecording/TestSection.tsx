import assert from "assert";
import { useContext } from "react";
import AutoSizer from "react-virtualized-auto-sizer";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { TestEvent, TestSectionName } from "shared/test-suites/RecordingTestMetadata";
import { TestSuiteCache } from "ui/components/TestSuite/suspense/TestSuiteCache";
import { TestSectionRow } from "ui/components/TestSuite/views/TestRecording/TestSectionRow";

import { TestEventsList } from "./TestEventsList";
import styles from "./TestSection.module.css";

export default function TestSection({
  testEvents,
  testSectionName,
  title,
}: {
  testEvents: TestEvent[];
  testSectionName: TestSectionName;
  title: string;
}) {
  const replayClient = useContext(ReplayClientContext);
  const { recordingId } = useContext(SessionContext);

  if (testEvents.length === 0) {
    return null;
  }

  const groupedTestCases = TestSuiteCache.read(replayClient, recordingId);
  assert(groupedTestCases != null);

  return (
    <>
      <div className={styles.Title} data-test-name="TestSection">
        {title}
      </div>
      {/* <AutoSizer disableWidth>
        {({ height }: { height: number }) => (
          <TestEventsList
            height={height - 32}
            noContentFallback={<div>Loading...</div>}
            events={testEvents}
          />
        )}
      </AutoSizer> */}
      {/* {testEvents.map((testEvent, index) => (
        <TestSectionRow
          key={index}
          testEvent={testEvent}
          testRunnerName={groupedTestCases.environment.testRunner?.name ?? null}
          testSectionName={testSectionName}
        />
      ))} */}
    </>
  );
}
