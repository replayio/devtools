import { memo } from "react";

import { NavigationTestStep } from "ui/components/TestSuite/types";

import styles from "./NavigationTestStepRow.module.css";

export default memo(function NavigationTestStepRow({
  navigationTestStep,
}: {
  navigationTestStep: NavigationTestStep;
}) {
  function truncateMiddle(string, maxLength = 250, separator = "...") {
    if (string.length > maxLength) {
      const charIndex = (maxLength - separator.length) / 2;
      return (
        string.slice(0, Math.ceil(charIndex)) + separator + string.slice(0 - Math.ceil(charIndex))
      );
    }

    return string;
  }
  let url = navigationTestStep.data.url || "";
  let displayUrl = truncateMiddle(url);

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
