import { memo, useState } from "react";

import { truncateMiddle } from "replay-next/src/utils/string";
import { FunctionEvent } from "shared/test-suites/RecordingTestMetadata";

import { TestSectionRow } from "../TestSectionRow";
import styles from "./HelperFunctionEvent.module.css";

export default memo(function HelperFunctionEventRow({
  functionEvent,
  testRunnerName,
  testSectionName,
  nestingLevel,
}: {
  functionEvent: FunctionEvent;
  testRunnerName: string | null;
  testSectionName: string;
  nestingLevel: number;
}) {
  const [collapsed, toggleCollapsed] = useState(true);
  const formattedName = truncateMiddle(functionEvent.function, 150);
  const events = functionEvent.events;

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
