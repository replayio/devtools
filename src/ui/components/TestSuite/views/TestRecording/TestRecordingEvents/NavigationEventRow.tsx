import { memo } from "react";

import { NavigationEvent } from "shared/test-suites/RecordingTestMetadata";

import styles from "./NavigationEventRow.module.css";

export default memo(function NavigationEventRow({
  navigationEvent,
}: {
  navigationEvent: NavigationEvent;
}) {
  return (
    <div className={styles.Indented}>
      <div className={styles.Text}>
        Opened <span className={styles.Name}>{navigationEvent.data.url}</span>
      </div>
    </div>
  );
});
