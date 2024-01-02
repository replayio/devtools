import { useTestRunDetailsSuspends } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRunDetailsSuspends";

import styles from "./TestRuns.module.css";

export function RunStats({ testRunId }: { testRunId: string }) {
  const { groupedTests } = useTestRunDetailsSuspends(testRunId);
  if (groupedTests === null) {
    return null;
  }

  const { passedRecordings, failedRecordings, flakyRecordings } = groupedTests;

  const passed = passedRecordings.count;
  const failed = failedRecordings.count;
  const flakyCount = flakyRecordings.count;

  return (
    <div className="flex shrink space-x-2">
      {failed > 0 && <Pill status="failed" className={styles.failedPill} value={failed} />}
      {flakyCount > 0 && <Pill status="flaky" className={styles.flakyPill} value={flakyCount} />}
      {passed > 0 && <Pill status="success" className={styles.successPill} value={passed} />}
    </div>
  );
}

function Pill({
  status,
  className,
  value,
}: {
  status: "failed" | "success" | "flaky";
  className: string;
  value: number;
}) {
  return (
    <div
      data-test-id={`Pill-${status}`}
      className={`flex h-[1.35rem] min-w-[1.35rem] items-center justify-center rounded-md text-xs font-bold ${className}`}
    >
      {value}
    </div>
  );
}
