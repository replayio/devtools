import { useContext } from "react";

import { UserActionEvent, isUserActionTestEvent } from "shared/test-suites/RecordingTestMetadata";
import { useShowUserActionEventBoundary } from "ui/components/TestSuite/hooks/useShowUserActionEventBoundary";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import styles from "./ToggleButton.module.css";

export default function ToggleButton() {
  const { testEvent } = useContext(TestSuiteContext);

  // Only show the hover button for user-action events
  if (testEvent === null || !isUserActionTestEvent(testEvent)) {
    return null;
  }

  const { timeStampedPoints } = testEvent.data;
  if (
    timeStampedPoints.beforeStep == null ||
    timeStampedPoints.afterStep == null ||
    timeStampedPoints.beforeStep.point === timeStampedPoints.afterStep.point
  ) {
    return null;
  }

  return <ToggleButtonInner userActionEvent={testEvent} />;
}

function ToggleButtonInner({ userActionEvent }: { userActionEvent: UserActionEvent }) {
  const { disabled: disabledShowAfter, onClick: onClickShowAfter } = useShowUserActionEventBoundary(
    {
      boundary: "after",
      userActionEvent,
    }
  );
  const { disabled: disabledShowBefore, onClick: onClickShowBefore } =
    useShowUserActionEventBoundary({
      boundary: "before",
      userActionEvent,
    });

  return (
    <div className={styles.ToggleWrapper} data-test-name="ToggleBeforeAfterEventButton">
      <div className={styles.ToggleContainer}>
        <Button onClick={onClickShowBefore} active={disabledShowBefore}>
          Before
        </Button>
        <Button onClick={onClickShowAfter} active={disabledShowAfter}>
          After
        </Button>
      </div>
    </div>
  );
}

function Button({
  children,
  active,
  onClick,
}: {
  children: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button className={`${styles.ToggleButton} ${active ? styles.Active : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}
