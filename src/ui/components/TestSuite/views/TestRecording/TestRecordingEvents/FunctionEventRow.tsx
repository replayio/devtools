import { memo, useState } from "react";

import { truncateMiddle } from "replay-next/src/utils/string";
import { RecordingTestMetadataV3 } from "shared/test-suites/RecordingTestMetadata";

import { TestSectionRow } from "../TestSectionRow";
import styles from "./FunctionEventRow.module.css";

export default memo(function FunctionEventRow({
  functionEvent,
  testRunnerName,
  testSectionName,
  nestingLevel,
}: {
  functionEvent: RecordingTestMetadataV3.FunctionEvent;
  testRunnerName: string | null;
  testSectionName: string;
  nestingLevel: number;
}) {
  const [collapsed, toggleCollapsed] = useState(true);
  const formattedName = truncateMiddle(functionEvent.data.function, 150);
  const events = functionEvent.data.events;

  return (
    <div className={styles.Row}>
      <div
        style={{}}
        className={styles.FunctionRow}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
          toggleCollapsed(!collapsed);
        }}
      >
        <span className={styles.Name}>{formattedName || "Outer function"}</span>
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          marginTop: collapsed ? 0 : "1rem",
        }}
      >
        {!collapsed &&
          events.map((testEvent, index) => (
            <TestSectionRow
              key={index}
              testEvent={testEvent}
              testRunnerName={testRunnerName}
              testSectionName={testSectionName}
              nestingLevel={nestingLevel + 1}
            />
          ))}
      </div>
    </div>
  );
});
