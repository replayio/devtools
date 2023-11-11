import { useTestRunDetailsSuspends } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRunDetailsSuspends";

import styles from "../../../Library.module.css";

export function TestStats({ testRunId }: { testRunId: string }) {
  // const { groupedTests } = useTestRunDetailsSuspends(testRunId);
  const groupedTests = null;
  if (groupedTests === null) {
    return null;
  }

  const { passedRecordings, failedRecordings, flakyRecordings } = groupedTests;

  const passed = passedRecordings.count;
  const failed = failedRecordings.count;
  const flakyCount = flakyRecordings.count;

  return (
    <div className="flex shrink space-x-2">
      {failed > 0 && <Pill className={styles.failedPill} value={failed} />}
      {flakyCount > 0 && <Pill className={styles.flakyPill} value={flakyCount} />}
      {passed > 0 && <Pill className={styles.successPill} value={passed} />}
    </div>
  );
}

function Pill({ className, value }: { className: string; value: number }) {
  return (
    <div
      className={`flex h-[1.35rem] min-w-[1.35rem] items-center justify-center rounded-md text-xs font-bold ${className}`}
    >
      {value}
    </div>
  );
}
