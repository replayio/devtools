import assert from "assert";
import { ReactNode, useContext, useMemo, useTransition } from "react";

import Icon from "replay-next/components/Icon";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  TestEvent,
  TestSectionName,
  getTestEventTime,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { seek, setTimelineToTime } from "ui/actions/timeline";
import { TestSuiteCache } from "ui/components/TestSuite/suspense/TestSuiteCache";
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
  const replayClient = useContext(ReplayClientContext);
  const { recordingId } = useContext(SessionContext);
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

  const groupedTestCases = TestSuiteCache.read(replayClient, recordingId);
  assert(groupedTestCases !== null);

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
          groupedTestCases={groupedTestCases}
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

  const onClick = () => {
    startTransition(() => {
      setTestEvent(testEvent);
    });

    if (isUserActionTestEvent(testEvent)) {
      const timeStampedPoint = testEvent.timeStampedPointRange?.begin ?? null;
      if (timeStampedPoint) {
        dispatch(seek(timeStampedPoint.point, timeStampedPoint.time, false));
      }
    } else {
      const { point, time } = testEvent.timeStampedPoint;
      dispatch(seek(point, time, false));
    }
  };

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
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {child}

      <button
        className={styles.DropDownButton}
        onClick={onContextMenu}
        data-test-name="TestSectionRowMenuButton"
      >
        <Icon className={position === "current" ? styles.Icon : styles.HiddenIcon} type="dots" />
      </button>

      {contextMenu}
    </div>
  );
}
