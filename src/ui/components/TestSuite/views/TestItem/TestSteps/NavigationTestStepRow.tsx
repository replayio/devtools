import { memo } from "react";

import { NavigationTestStep } from "ui/components/TestSuite/types";

import styles from "./NavigationTestStepRow.module.css";

export default memo(function NavigationTestStepRow({
  navigationTestStep,
}: {
  navigationTestStep: NavigationTestStep;
}) {
  let url = navigationTestStep.data.url || "";
  let displayUrl = url.length > 500 ? url.slice(0, 500) + "..." : url;

  return (
    <div className={styles.Indented}>
      <div className={styles.Text}>
        <span className={styles.Name} title={url}>
          {displayUrl}
        </span>
      </div>
    </div>
  );
});
