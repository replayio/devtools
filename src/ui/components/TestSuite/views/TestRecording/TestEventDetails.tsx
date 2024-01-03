import { useContext } from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { isUserActionTestEvent } from "shared/test-suites/RecordingTestMetadata";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import { PlaywrightUserActionEventDetails } from "./TestEventStepDetails/PlaywrightUserActionEventDetails";
import { UserActionEventPropsInspector } from "./TestEventStepDetails/UserActionEventPropsInspector";
import styles from "./TestEventStepDetails/TestEventDetails.module.css";

export default function TestEventDetails({ collapsed }: { collapsed: boolean }) {
  const { testEvent } = useContext(TestSuiteContext);

  if (collapsed) {
    return null;
  } else if (testEvent == null || !isUserActionTestEvent(testEvent)) {
    return <SelectionPrompt />;
  }

  const { testRunnerName } = testEvent.data;
  const UserEventDetailsComponent =
    testRunnerName === "playwright"
      ? PlaywrightUserActionEventDetails
      : UserActionEventPropsInspector;

  return (
    <InlineErrorBoundary name="TestEventDetails">
      <UserEventDetailsComponent testEvent={testEvent} />
    </InlineErrorBoundary>
  );
}

function SelectionPrompt() {
  return (
    <div className={styles.Message} data-test-name="TestEventDetailsMessage">
      Select an action above to view its details
    </div>
  );
}
