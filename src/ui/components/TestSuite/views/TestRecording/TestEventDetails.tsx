import { useContext } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import { isUserActionTestEvent } from "shared/test-suites/RecordingTestMetadata";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import { CypressUserActionEventDetails } from "./CypressUserActionEventDetails";
import { PlaywrightUserActionEventDetails } from "./PlaywrightUserActionEventDetails";
import { LoadingFailedMessage } from "./TestEventLoadingMessages";
import styles from "./TestEventDetails.module.css";

export default function TestEventDetails({ collapsed }: { collapsed: boolean }) {
  const { testEvent } = useContext(TestSuiteContext);

  if (collapsed) {
    return null;
  } else if (testEvent == null || !isUserActionTestEvent(testEvent)) {
    return <SelectionPrompt />;
  } else if (testEvent.data.testSourceCallStack !== null) {
    return (
      <PlaywrightUserActionEventDetails
        key={testEvent.data.id}
        stack={testEvent.data.testSourceCallStack}
      />
    );
  } else if (!testEvent.data.resultVariable || !testEvent.data.timeStampedPoints.result) {
    return <LoadingFailedMessage />;
  }

  return (
    <ErrorBoundary name="TestEventDetails">
      <CypressUserActionEventDetails
        timeStampedPoint={testEvent.data.timeStampedPoints.result}
        variable={testEvent.data.resultVariable}
      />
    </ErrorBoundary>
  );
}

function SelectionPrompt() {
  return (
    <div className={styles.Message} data-test-name="TestEventDetailsMessage">
      Select an action above to view its details
    </div>
  );
}
