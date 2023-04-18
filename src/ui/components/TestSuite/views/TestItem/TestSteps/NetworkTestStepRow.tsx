import { memo } from "react";

import { NetworkTestStep } from "ui/components/TestSuite/types";

import styles from "./NetworkTestStepRow.module.css";

export default memo(function NetworkTestStepRow({
  networkTestStep,
}: {
  networkTestStep: NetworkTestStep;
}) {
  const { method, status, url } = networkTestStep.data;

  let statusBadge: string | null = null;
  if (status != null) {
    if (status >= 400) {
      statusBadge = "error";
    } else {
      statusBadge = "success";
    }
  }

  const pathname = new URL(url).pathname;

  return (
    <div className={styles.Indented}>
      <div className={styles.Text}>
        {statusBadge !== null && (
          <>
            <span className={styles.StatusBadge} data-status-badge={statusBadge} />{" "}
          </>
        )}
        <span className={styles.Token}>{method}</span>{" "}
        {status && (
          <>
            <span className={styles.Token}>{status}</span>{" "}
          </>
        )}
        <span className={styles.Token}>{pathname}</span>
      </div>
    </div>
  );
});
