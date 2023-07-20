import assert from "assert";
import { TimeStampedPoint } from "@replayio/protocol";
import { ReactNode, useContext, useMemo, useTransition } from "react";

import Icon from "replay-next/components/Icon";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  TestEvent,
  TestRunnerName,
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
  testRunnerName,
  testSectionName,
}: {
  testEvent: TestEvent;
  testRunnerName: TestRunnerName | null;
  testSectionName: TestSectionName;
}) {
  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);
  const replayClient = useContext(ReplayClientContext);
  const { recordingId } = useContext(SessionContext);
  const {
    setTestEvent,
    testEvent: selectedTestEvent,
    testRecording,
  } = useContext(TestSuiteContext);

  const isSelected = testEvent === selectedTestEvent;

  const dispatch = useAppDispatch();

  const [isPending, startTransition] = useTransition();

  const { contextMenu, onContextMenu } = useTestEventContextMenu(testEvent);

  const position = useMemo(() => {
    let position: Position = "after";
    if (selectedTestEvent) {
      switch (testRunnerName) {
        case "cypress": {
          let timeStampedPoint: TimeStampedPoint | null = null;
          if (isUserActionTestEvent(testEvent)) {
            timeStampedPoint = testEvent.timeStampedPointRange?.begin ?? null;
          } else {
            timeStampedPoint = testEvent.timeStampedPoint;
          }

          if (timeStampedPoint) {
            position = isExecutionPointsGreaterThan(timeStampedPoint.point, currentExecutionPoint)
              ? "after"
              : "before";
          }
          break;
        }
        default: {
          // Playwright tests don't have annotations (or execution points)
          const index = testRecording!.events[testSectionName].indexOf(testEvent);
          const selectedIndex = testRecording!.events[testSectionName].indexOf(selectedTestEvent);
          position = index <= selectedIndex ? "before" : "after";
          break;
        }
      }
    }

    return position;
  }, [
    currentExecutionPoint,
    selectedTestEvent,
    testEvent,
    testRecording,
    testRunnerName,
    testSectionName,
  ]);

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
          isSelected={isSelected}
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
    if (!isSelected) {
      dispatch(setTimelineToTime(getTestEventTime(testEvent)));
    }
  };

  const onMouseLeave = () => {
    if (!isSelected) {
      dispatch(setTimelineToTime(null));
    }
  };

  return (
    <div
      className={styles.Row}
      data-context-menu-active={contextMenu !== null || undefined}
      data-is-pending={isPending || undefined}
      data-position={position}
      data-selected={isSelected || undefined}
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
        <Icon className={isSelected ? styles.Icon : styles.HiddenIcon} type="dots" />
      </button>

      {contextMenu}
    </div>
  );
}
