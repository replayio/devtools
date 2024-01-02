import { UserActionEvent } from "shared/test-suites/RecordingTestMetadata";

import { LoadingFailedMessage } from "./TestEventDetailsLoadingMessages";
import { UserActionEventPropsInspector } from "./UserActionEventPropsInspector";
import styles from "./TestEventDetails.module.css";

export function CypressUserActionStepDetails({
  testEvent,
  testEventPending,
}: {
  testEvent: UserActionEvent;
  testEventPending?: boolean;
}) {
  return (
    <div
      className={styles.UserActionEventDetails}
      data-test-name="UserActionEventDetails"
      data-is-pending={testEventPending || undefined}
    >
      {testEvent.data.timeStampedPoints.result ? (
        <UserActionEventPropsInspector testEvent={testEvent} />
      ) : (
        <LoadingFailedMessage />
      )}
    </div>
  );
}
