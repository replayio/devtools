import { ReactNode, useContext, useTransition } from "react";

import { comparePoints } from "protocol/execution-point-utils";
import Icon from "replay-next/components/Icon";
import { TestEvent, TestSectionName, getExecutionPoint, getTime } from "shared/test-suites/types";
import { setTimelineToTime } from "ui/actions/timeline";
import { useTestEventContextMenu } from "ui/components/TestSuite/views/TestRecording/useTestEventContextMenu";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";
import { useAppDispatch } from "ui/setup/hooks";

import NavigationEventRow from "./TestRecordingEvents/NavigationEventRow";
import NetworkRequestEventRow from "./TestRecordingEvents/NetworkRequestEventRow";
import UserActionEventRow from "./TestRecordingEvents/UserActionEventRow";
import { Position } from "./types";
import styles from "./TestSectionRow.module.css";

export function TestSectionRow({
  testEvent,
  testSectionName,
}: {
  testEvent: TestEvent;
  testSectionName: TestSectionName;
}) {
  const { testEvent: selectedTestEvent, setTestEvent } = useContext(TestSuiteContext);

  const dispatch = useAppDispatch();

  const [isPending, startTransition] = useTransition();

  const { contextMenu, onContextMenu } = useTestEventContextMenu(testEvent);

  let position: Position = "after";
  if (selectedTestEvent) {
    if (selectedTestEvent === testEvent) {
      position = "current";
    } else {
      position =
        comparePoints(getExecutionPoint(testEvent), getExecutionPoint(selectedTestEvent)) <= 0
          ? "before"
          : "after";
    }
  }

  let child: ReactNode;
  let status;
  switch (testEvent.type) {
    case "navigation":
      child = <NavigationEventRow navigationEvent={testEvent} />;
      break;
    case "network-request":
      child = <NetworkRequestEventRow networkRequestEvent={testEvent} />;
      break;
    case "user-action":
      child = (
        <UserActionEventRow
          position={position}
          testSectionName={testSectionName}
          userActionEvent={testEvent}
        />
      );
      status = testEvent.data.error ? "error" : "success";
      break;
    default:
      throw Error(`Unknown test step type: "${(testEvent as any).type}"`);
  }

  const onMouseEnter = async () => {
    if (selectedTestEvent !== testEvent) {
      dispatch(setTimelineToTime(getTime(testEvent)));
    }
  };

  const onMouseLeave = () => {
    if (selectedTestEvent !== testEvent) {
      dispatch(setTimelineToTime(null));
    }
  };

  return (
    <div
      className={styles.Row}
      data-context-menu-active={contextMenu !== null || undefined}
      data-is-pending={isPending || undefined}
      data-position={position}
      data-status={status}
      data-type={testEvent.type}
      data-test-name="TestSectionRow"
      onClick={() => {
        startTransition(() => {
          setTestEvent(testEvent);
        });
      }}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {child}
      {position === "current" && (
        <button className={styles.DropDownButton} onClick={onContextMenu}>
          <Icon className={styles.Icon} type="dots" />
        </button>
      )}
      {contextMenu}
    </div>
  );
}
