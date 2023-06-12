import { ReactNode, useContext, useMemo, useTransition } from "react";

import { comparePoints } from "protocol/execution-point-utils";
import Icon from "replay-next/components/Icon";
import {
  TestEvent,
  TestSectionName,
  getTestEventExecutionPoint,
  getTestEventTime,
} from "shared/test-suites/RecordingTestMetadata";
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
  const {
    setTestEvent,
    testEvent: selectedTestEvent,
    testRecording,
  } = useContext(TestSuiteContext);

  const dispatch = useAppDispatch();

  const [isPending, startTransition] = useTransition();

  const { contextMenu, onContextMenu } = useTestEventContextMenu(testEvent);

  const position = useMemo(() => {
    let position: Position = "after";
    if (selectedTestEvent) {
      if (selectedTestEvent === testEvent) {
        position = "current";
      } else {
        // Compare using indices rather than execution points
        // because Playwright tests don't have annotations (or execution points)
        const index = testRecording!.events[testSectionName].indexOf(testEvent);
        const selectedIndex = testRecording!.events[testSectionName].indexOf(selectedTestEvent);
        position = index < selectedIndex ? "before" : "after";
      }
    }

    return position;
  }, [selectedTestEvent, testEvent, testRecording, testSectionName]);

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
      dispatch(setTimelineToTime(getTestEventTime(testEvent)));
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
