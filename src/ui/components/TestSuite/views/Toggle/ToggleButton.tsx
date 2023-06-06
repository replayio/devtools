import { useContext } from "react";

import { UserActionEvent, isUserActionEvent } from "shared/test-suites/types";
import { useShowUserActionEventBoundary } from "ui/components/TestSuite/hooks/useShowUserActionEventBoundary";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import styles from "./ToggleButton.module.css";

export default function ToggleButton() {
  const { testEvent } = useContext(TestSuiteContext);

  // Only show the hover button for user-action events
  if (testEvent === null || !isUserActionEvent(testEvent)) {
    return null;
  }

  const { timeStampedPointRange } = testEvent;
  if (timeStampedPointRange.begin.point === timeStampedPointRange.end.point) {
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
    <div className={styles.ToggleWrapper}>
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
