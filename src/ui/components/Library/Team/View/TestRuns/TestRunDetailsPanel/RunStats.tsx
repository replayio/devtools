import { useTestRunDetailsSuspends } from "../hooks/useTestRunDetailsSuspends";
import styles from "./RunStats.module.css";

export function RunStats({ testRunId }: { testRunId: string }) {
  const { groupedTests, tests } = useTestRunDetailsSuspends(testRunId);
  if (groupedTests === null || !tests?.length) {
    return null;
  }

  const { passedRecordings, failedRecordings, flakyRecordings } = groupedTests;

  const passed = passedRecordings.count;
  const failed = failedRecordings.count;
  const flakyCount = flakyRecordings.count;

  return (
    <div className="flex shrink space-x-2">
      {failed > 0 && <Pill status="failed" value={failed} />}
      {flakyCount > 0 && <Pill status="flaky" value={flakyCount} />}
      {passed > 0 && <Pill status="success" value={passed} />}
    </div>
  );
}

const pillStyles = {
  success: styles.successPill,
  failed: styles.failedPill,
  flaky: styles.flakyPill,
};

function Pill({ status, value }: { status: "failed" | "success" | "flaky"; value: number }) {
  return (
    <div data-test-id={`Pill-${status}`} className={`${styles.Pill} ${pillStyles[status]}`}>
      {value}
    </div>
  );
}
