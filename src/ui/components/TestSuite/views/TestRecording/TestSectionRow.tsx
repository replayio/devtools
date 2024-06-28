import assert from "assert";
import { TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";
import { ReactNode, useContext, useMemo } from "react";

import { highlightNodes, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { RecordedMouseEventsCache } from "protocol/RecordedEventsCache";
import Icon from "replay-next/components/Icon";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import {
  isExecutionPointsGreaterThan,
  isExecutionPointsWithinRange,
} from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  TestEvent,
  TestRunnerName,
  TestSectionName,
  getTestEventTime,
  getTestEventTimeStampedPoint,
  getUserActionEventRange,
  isUserActionTestEvent,
  isUserClickEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { extendFocusWindowIfNecessary, seek, setHoverTime } from "ui/actions/timeline";
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
  testEvents,
  testRunnerName,
  testSectionName,
}: {
  testEvent: TestEvent;
  testEvents: TestEvent[];
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
    testEventPending,
  } = useContext(TestSuiteContext);

  const isSelected = testEvent === selectedTestEvent;

  const dispatch = useAppDispatch();

  const { contextMenu, onContextMenu } = useTestEventContextMenu(testEvent, testEvents);

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
          testEvents={testEvents}
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
    setTestEvent(testEvent);

    let timeStampedPoint: TimeStampedPoint | null = null;
    let testEventRange: TimeStampedPointRange | null = null;

    if (isUserActionTestEvent(testEvent)) {
      timeStampedPoint = testEvent.data.timeStampedPoints.beforeStep ?? null;
      testEventRange = getUserActionEventRange(testEvent);
    } else {
      timeStampedPoint = testEvent.timeStampedPoint;
      testEventRange = {
        begin: timeStampedPoint,
        end: timeStampedPoint,
      };
    }

    if (timeStampedPoint && testEventRange) {
      // It's possible that this step is outside of the current focus window
      // In order to show details below, we need to adjust the focus window
      // See FE-1756
      await dispatch(extendFocusWindowIfNecessary(testEventRange));
      await dispatch(seek({ ...timeStampedPoint, openSource: false }));
    }
  };

  const onMouseEnter = async () => {
    let hoverTime: number | null = null;
    if (isUserActionTestEvent(testEvent) && isUserClickEvent(testEvent)) {
      // Find the actual mouse event that _should_ have occurred
      // inside of this test step. We want to use that as the hover
      // time, so that the `RecordedCursor` logic will show the mouse
      // event correctly instead of finding an _earlier_ mouse event
      // that happened _before_ this test step.
      const { data } = testEvent;
      const { timeStampedPoints } = data;
      const mouseEvents = RecordedMouseEventsCache.getValueIfCached();

      if (timeStampedPoints.beforeStep !== null && timeStampedPoints.afterStep !== null) {
        const mouseEvent = mouseEvents?.find(e => {
          return (
            e.kind === "mousedown" &&
            isExecutionPointsWithinRange(
              e.point,
              timeStampedPoints.beforeStep!.point,
              timeStampedPoints.afterStep!.point
            )
          );
        });

        hoverTime = mouseEvent?.time ?? null;
      }
    }

    if (!hoverTime) {
      // Otherwise, default the hover time to whatever is most
      // appropriate for this test step based on its type.
      hoverTime = getTestEventTime(testEvent);
    }

    dispatch(setHoverTime(hoverTime));

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
      data-is-pending={testEventPending || undefined}
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
