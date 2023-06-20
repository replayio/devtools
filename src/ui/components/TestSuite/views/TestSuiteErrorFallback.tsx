import { useContext } from "react";

import Icon from "replay-next/components/Icon";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { getGroupedTestCasesTitle } from "shared/test-suites/RecordingTestMetadata";
import { RecordingCache } from "ui/components/TestSuite/suspense/RecordingCache";
import { formatTitle } from "ui/components/TestSuite/utils/formatTitle";

import styles from "./TestSuiteErrorFallback.module.css";

export default function TestSuiteErrorFallback() {
  const { recordingId } = useContext(SessionContext);

  const recording = RecordingCache.read(recordingId);
  const rawTestMetadata = recording.metadata?.test;

  const title = rawTestMetadata ? getGroupedTestCasesTitle(rawTestMetadata) : null;
  const processedTitle = title ? formatTitle(title) : "Test";

  return (
    <div className={styles.Fallback}>
      <div className={styles.Header}>
        <div className={styles.Title} title={title || undefined}>
          {processedTitle}
        </div>
      </div>
      <div className={styles.ErrorMessage}>
        <Icon className={styles.ErrorIcon} type="warning" />
        Something went wrong processing test metadata.
      </div>
      <div className={styles.ContactUsMessage}>
        Please{" "}
        <a className={styles.Link} href="http://replay.io/discord" target="discord">
          contact us
        </a>{" "}
        on Discord.
      </div>
    </div>
  );
}
