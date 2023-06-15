import { TimeStampedPoint } from "@replayio/protocol";
import { useContext } from "react";
import { STATUS_PENDING, useImperativeCacheValue } from "suspense";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import PropertiesRenderer from "replay-next/components/inspector/PropertiesRenderer";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isUserActionTestEvent } from "shared/test-suites/RecordingTestMetadata";
import { TestEventDetailsCache } from "ui/components/TestSuite/suspense/TestEventDetailsCache";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import styles from "./TestEventDetails.module.css";

export default function TestEventDetails({ collapsed }: { collapsed: boolean }) {
  const { testEvent } = useContext(TestSuiteContext);

  if (collapsed) {
    return null;
  } else if (testEvent == null || !isUserActionTestEvent(testEvent)) {
    return <SelectionPrompt />;
  } else if (testEvent.data.result == null) {
    return <LoadingFailedMessage />;
  }

  return (
    <ErrorBoundary>
      <UserActionEventDetails
        timeStampedPoint={testEvent.data.result.timeStampedPoint}
        variable={testEvent.data.result.variable}
      />
    </ErrorBoundary>
  );
}

function UserActionEventDetails({
  timeStampedPoint,
  variable,
}: {
  timeStampedPoint: TimeStampedPoint;
  variable: string;
}) {
  const replayClient = useContext(ReplayClientContext);

  const { status, value } = useImperativeCacheValue(
    TestEventDetailsCache,
    replayClient,
    timeStampedPoint,
    variable
  );

  if (status === STATUS_PENDING) {
    return <LoadingInProgress />;
  } else if (value?.props == null || value?.pauseId == null) {
    return <LoadingFailedMessage />;
  }

  return (
    <div className={styles.Container} data-test-name="UserActionEventDetails">
      <PropertiesRenderer pauseId={value.pauseId} object={value.props} />
    </div>
  );
}

function LoadingFailedMessage() {
  return (
    <div className={styles.Message} data-test-name="TestEventDetailsMessage">
      Unable to retrieve details for this step
    </div>
  );
}

function LoadingInProgress() {
  return (
    <div className={styles.Message} data-test-name="TestEventDetailsMessage">
      Loading...
    </div>
  );
}

function SelectionPrompt() {
  return (
    <div className={styles.Message} data-test-name="TestEventDetailsMessage">
      Select an action above to view its details
    </div>
  );
}
