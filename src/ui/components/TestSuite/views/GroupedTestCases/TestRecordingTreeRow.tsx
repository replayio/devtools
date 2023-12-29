import { useTransition } from "react";

import Icon from "replay-next/components/Icon";
import { TestRecording } from "shared/test-suites/RecordingTestMetadata";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { TestResultIcon } from "ui/components/TestSuite/components/TestResultIcon";

import styles from "./TestRecordingTreeRow.module.css";

export default function TestRecordingTreeRow({
  flakyTestIds,
  onClick: onClickProp,
  testRecording,
}: {
  flakyTestIds: Set<string | number>;
  onClick: () => void;
  testRecording: TestRecording;
}) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => startTransition(onClickProp);

  const { attempt, error, id, result, source, testRunnerName } = testRecording;
  const { title } = source;

  const isFlaky = flakyTestIds.has(id);

  let showTitleAndError = true;
  if (testRunnerName === "cypress") {
    showTitleAndError = isFlaky ? result === "passed" : attempt === 1;
  }

  let attemptLabel;
  switch (result) {
    case "failed":
    case "timedOut":
      attemptLabel = "failed";
      break;
    case "skipped":
    case "unknown":
      attemptLabel = "skipped";
      break;
  }

  return (
    <li
      className={result === "skipped" ? styles.SkippedRow : styles.Row}
      data-is-pending={isPending || undefined}
      data-test-name="TestRecordingTreeRow"
      onClick={onClick}
    >
      {showTitleAndError || <Icon className={styles.NestedIcon} type="arrow-nested" />}
      <TestResultIcon result={result} />
      <div className={styles.Column}>
        <div className={styles.HeaderRow}>
          <div className={styles.Title}>
            {showTitleAndError ? (
              title
            ) : (
              <>
                <span className={styles.AttemptLabel}>{attemptLabel}</span>
                <span className={styles.AttemptNumber}>(attempt {attempt})</span>
              </>
            )}
          </div>
          <MaterialIcon className={styles.Chevron}>chevron_right</MaterialIcon>
        </div>
        {showTitleAndError && error && (
          <div className={styles.Error}>
            <span className={styles.ErrorTitle}>Error:</span> {error.message}
          </div>
        )}
      </div>
    </li>
  );
}
