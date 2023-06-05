import { useTransition } from "react";

import { TestRecording } from "shared/test-suites/types";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { TestResultIcon } from "ui/components/TestSuite/components/TestResultIcon";

import styles from "./TestRecordingTreeRow.module.css";

export default function TestRecordingTreeRow({
  onClick: onClickProp,
  testRecording,
}: {
  onClick: () => void;
  testRecording: TestRecording;
}) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => startTransition(onClickProp);

  const { error, result, source } = testRecording;
  const { title } = source;

  return (
    <li
      className={styles.Row}
      data-is-pending={isPending || undefined}
      data-test-name="TestRecordingTreeRow"
      onClick={onClick}
    >
      <TestResultIcon result={result} />
      <div className={styles.Column}>
        <div className={styles.Title}>{title}</div>
        {error && (
          <div className={styles.Error}>
            <span className={styles.ErrorTitle}>Error:</span> {error.message}
          </div>
        )}
      </div>
      <MaterialIcon className={styles.Chevron}>chevron_right</MaterialIcon>
    </li>
  );
}
