import { memo, useState } from "react";

import { truncateMiddle } from "replay-next/src/utils/string";
import { FunctionEvent } from "shared/test-suites/RecordingTestMetadata";

import { TestSectionRow } from "../TestSectionRow";
import styles from "./HelperFunctionEvent.module.css";

export default memo(function HelperFunctionEventRow({
  functionEvent,
  testRunnerName,
  testSectionName,
}: {
  functionEvent: FunctionEvent;
  testRunnerName: string | null;
  testSectionName: string;
}) {
  const [collapsed, toggleCollapsed] = useState(true);
  const formattedName = truncateMiddle(functionEvent.function, 150);
  const events = functionEvent.events;
  console.log(`>>>`, functionEvent, events);

  return (
    <div className={styles.Row}>
      <div
        style={{}}
        className={styles.Text}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
          toggleCollapsed(!collapsed);
        }}
      >
        <span className={styles.Name}>{formattedName || "Outer function"}</span>
      </div>
      {!collapsed &&
        events.map((testEvent, index) => (
          <TestSectionRow
            key={index}
            testEvent={testEvent}
            testRunnerName={testRunnerName}
            testSectionName={testSectionName}
          />
        ))}
    </div>
  );
});
