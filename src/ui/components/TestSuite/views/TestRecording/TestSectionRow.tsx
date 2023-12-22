import assert from "assert";
import { ExecutionPoint, TimeStampedPoint } from "@replayio/protocol";
import { ReactNode, useContext, useMemo, useTransition } from "react";

import { highlightNodes, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import Icon from "replay-next/components/Icon";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import {
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
} from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  TestEvent,
  TestRunnerName,
  TestSectionName,
  getTestEventTime,
  getTestEventTimeStampedPoint,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { isPointInRegion } from "shared/utils/time";
import { requestFocusWindow, seek, setHoverTime } from "ui/actions/timeline";
import { TestSuiteCache } from "ui/components/TestSuite/suspense/TestSuiteCache";
import { useTestEventContextMenu } from "ui/components/TestSuite/views/TestRecording/useTestEventContextMenu";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";
import { useAppDispatch } from "ui/setup/hooks";

import { testEventDomNodeCache } from "../../suspense/TestEventDetailsCache";
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
  const { range: focusWindow } = useContext(FocusContext);
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
          const timeStampedPoint = getTestEventTimeStampedPoint(testEvent);

          if (timeStampedPoint) {
            position =
              !currentExecutionPoint ||
              isExecutionPointsGreaterThan(timeStampedPoint.point, currentExecutionPoint)
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

  const onClick = async () => {
    startTransition(() => {
      setTestEvent(testEvent);
    });

    let executionPoint: ExecutionPoint | null = null;
    let time: number | null = null;

    if (isUserActionTestEvent(testEvent)) {
      const timeStampedPoint = testEvent.data.timeStampedPoints.beforeStep ?? null;
      if (timeStampedPoint) {
        executionPoint = timeStampedPoint.point;
        time = timeStampedPoint.time;
      }
    } else {
      executionPoint = testEvent.timeStampedPoint.point;
      time = testEvent.timeStampedPoint.time;
    }

    // It's possible that this step is outside of the current focus window
    // In order to show details below, we need to adjust the focus window
    // See FE-1756
    if (executionPoint !== null && time !== null) {
      if (focusWindow && !isPointInRegion(executionPoint, focusWindow)) {
        const timeStampedPoint = { point: executionPoint, time };
        if (isExecutionPointsLessThan(executionPoint, focusWindow.begin.point)) {
          await dispatch(
            requestFocusWindow(
              {
                begin: timeStampedPoint,
                end: focusWindow.end,
              },
              "begin"
            )
          );
        } else {
          await dispatch(
            requestFocusWindow(
              {
                begin: focusWindow.begin,
                end: timeStampedPoint,
              },
              "end"
            )
          );
        }
      }

      await dispatch(seek({ executionPoint, openSource: false, time }));
    }
  };

  const onMouseEnter = async () => {
    dispatch(setHoverTime(getTestEventTime(testEvent)));
    if (!isUserActionTestEvent(testEvent)) {
      return;
    }

    // We hope to have details on the relevant DOM node cached by now.
    // If we do, go ahead and read that synchronously so we can highlight the node.
    const resultPoint = testEvent.data.timeStampedPoints.result;
    if (!resultPoint) {
      return;
    }

    const domNodesDetails = testEventDomNodeCache.getValueIfCached(resultPoint.point);

    if (!domNodesDetails) {
      return;
    }

    const { pauseId, domNodes } = domNodesDetails;
    // Highlight using bounding rects, which we should have pre-cached already
    dispatch(
      highlightNodes(
        domNodes.map(d => d.id),
        pauseId
      )
    );
  };

  const onMouseLeave = () => {
    dispatch(setHoverTime(null));

    if (isUserActionTestEvent(testEvent)) {
      dispatch(unhighlightNode());
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
