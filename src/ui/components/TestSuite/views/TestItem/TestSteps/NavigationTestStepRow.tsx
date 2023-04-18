import { memo } from "react";

import { NavigationTestStep } from "ui/components/TestSuite/types";

import styles from "./NavigationTestStepRow.module.css";

export default memo(function NavigationTestStepRow({
  navigationTestStep,
}: {
  navigationTestStep: NavigationTestStep;
}) {
  return (
    <div className={styles.Indented}>
      <div className={styles.Text}>
        <span className={styles.Name}>{navigationTestStep.data.url}</span>
      </div>
    </div>
  );
});
