import { memo } from "react";

import { truncateMiddle } from "replay-next/src/utils/string";
import { NavigationEvent } from "shared/test-suites/RecordingTestMetadata";

import styles from "./NavigationEventRow.module.css";

export default memo(function NavigationEventRow({
  navigationEvent,
}: {
  navigationEvent: NavigationEvent;
}) {
  const formattedUrl = truncateMiddle(navigationEvent.data.url, 150);

  return (
    <div className={styles.Indented}>
      <div className={styles.Text}>
        Opened <span className={styles.Name}>{formattedUrl}</span>
      </div>
    </div>
  );
});
