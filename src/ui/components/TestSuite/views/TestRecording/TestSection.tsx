import {
  TestEvent,
  TestRunnerName,
  TestSectionName,
} from "shared/test-suites/RecordingTestMetadata";
import { TestSectionRow } from "ui/components/TestSuite/views/TestRecording/TestSectionRow";

import styles from "./TestSection.module.css";

export default function TestSection({
  testEvents,
  testSectionName,
  testRunnerName,
  title,
}: {
  testEvents: TestEvent[];
  testSectionName: TestSectionName;
  testRunnerName: TestRunnerName;
  title: string;
}) {
  if (testEvents.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.Title} data-test-name="TestSection">
        {title}
      </div>
      {testEvents.map((testEvent, index) => (
        <TestSectionRow
          key={index}
          testEvent={testEvent}
          testEvents={testEvents}
          testRunnerName={testRunnerName}
          testSectionName={testSectionName}
        />
      ))}
    </>
  );
}
