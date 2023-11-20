import { memo, useState } from "react";

import Expandable from "replay-next/components/Expandable";
import { truncateMiddle } from "replay-next/src/utils/string";
import {
  RecordingTestMetadataV3,
  TestRunnerName,
  TestSectionName,
} from "shared/test-suites/RecordingTestMetadata";

import { TestSectionRow } from "../TestSectionRow";
import styles from "./HelperFunctionEvent.module.css";

export default memo(function HelperFunctionEventRow({
  functionEvent,
  testRunnerName,
  testSectionName,
}: {
  functionEvent: RecordingTestMetadataV3.FunctionEvent;
  testRunnerName: TestRunnerName | null;
  testSectionName: TestSectionName;
}) {
  const formattedName = truncateMiddle(
    `${functionEvent.data.function}:${functionEvent.data.line}`,
    150
  );
  const events = functionEvent.data.events;

  return (
    <div className={styles.Row}>
      <span className={styles.Name}>{formattedName || "Outer function"}</span>
    </div>
  );
});
