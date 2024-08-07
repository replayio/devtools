import findLast from "lodash/findLast";

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

  const scrollToEvent =
    testSectionName === "main"
      ? findLast(testEvents, evt => evt.type === "user-action" && !!evt.data.error)
      : undefined;

  return (
    <>
      <div className={styles.Title} data-test-name="TestSection">
        {title}
      </div>
      {testEvents.map((testEvent, index) => (
        <TestSectionRow
          key={index}
          scrollIntoView={testEvent === scrollToEvent}
          testEvent={testEvent}
          testEvents={testEvents}
          testRunnerName={testRunnerName}
          testSectionName={testSectionName}
        />
      ))}
    </>
  );
}
