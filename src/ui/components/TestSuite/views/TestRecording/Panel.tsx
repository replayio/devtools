import assert from "assert";
import findLast from "lodash/findLast";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ImperativePanelHandle,
  PanelGroup,
  PanelResizeHandle,
  Panel as ResizablePanel,
} from "react-resizable-panels";
import { useImperativeIntervalCacheValues } from "suspense";

import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  TestEvent,
  TestSectionName,
  getTestEventExecutionPoint,
  getTestEventTime,
} from "shared/test-suites/RecordingTestMetadata";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { TestResultIcon } from "ui/components/TestSuite/components/TestResultIcon";
import { TestError } from "ui/components/TestSuite/views/TestRecording/TestError";
import TestEventDetails from "ui/components/TestSuite/views/TestRecording/TestEventDetails";
import TestSection from "ui/components/TestSuite/views/TestRecording/TestSection";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import { testEventDetailsIntervalCache } from "../../suspense/TestEventDetailsCache";
import styles from "./Panel.module.css";

export default function Panel() {
  const { setTestEvent, setTestRecording, testEvent, testRecording } = useContext(TestSuiteContext);
  const { update } = useContext(TimelineContext);
  const { range: focusWindow } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);

  assert(testRecording != null);

  const stepDetailsPanelRef = useRef<ImperativePanelHandle>(null);

  const [stepDetailsPanelCollapsed, setStepDetailsPanelCollapsed] = useState(false);

  const committedValuesRef = useRef<{ testEvent: TestEvent | null }>({
    testEvent: null,
  });
  useEffect(() => {
    committedValuesRef.current.testEvent = testEvent;
  });

  // We only want to cache the test event details when the focus window has been updated
  // to match the range of the test recording in the case of Cypress tests. Experimentation shows there can be some renders
  // where the focus range and test range are mismatched, so try to avoid caching in those cases.
  //
  // Entering the panel in the case of Playwright recording doesn't change the focus range.
  // Playwright recordings are usually much shorter given each page is recorded separately
  // and it's OK to prefetch all of the test event details for them right away.
  const enableCache =
    testRecording.testRunnerName === "playwright" ||
    (focusWindow &&
      testRecording.timeStampedPointRange &&
      isExecutionPointsWithinRange(
        focusWindow.begin.point,
        testRecording.timeStampedPointRange.begin.point,
        testRecording.timeStampedPointRange.end.point
      ) &&
      isExecutionPointsWithinRange(
        focusWindow.end.point,
        testRecording.timeStampedPointRange.begin.point,
        testRecording.timeStampedPointRange.end.point
      ));

  useImperativeIntervalCacheValues(
    testEventDetailsIntervalCache,
    BigInt(focusWindow ? focusWindow.begin.point : "0"),
    BigInt(focusWindow ? focusWindow.end.point : "0"),
    replayClient,
    testRecording,
    enableCache
  );

  // Select a test step and update the current time
  const selectTestEvent = useCallback(
    async (testEvent: TestEvent | null) => {
      if (committedValuesRef.current.testEvent === testEvent) {
        return;
      }

      setTestEvent(testEvent);

      if (testEvent !== null) {
        const executionPoint = getTestEventExecutionPoint(testEvent);
        const time = getTestEventTime(testEvent);
        if (executionPoint !== null && time !== null) {
          update(time, executionPoint, false);
        }
      }
    },
    [setTestEvent, update]
  );

  const { beforeAll, beforeEach, main, afterEach, afterAll } = testRecording.events;
  const testSections: [testSectionName: TestSectionName, title: string, testEvents: TestEvent[]][] =
    [
      ["beforeAll", "before all", beforeAll],
      ["beforeEach", "before each", beforeEach],
      ["main", "test body", main],
      ["afterAll", "after each", afterEach],
      ["afterEach", "after all", afterAll],
    ];

  // Select a default test event
  useEffect(() => {
    const { testEvent } = committedValuesRef.current;
    if (testEvent !== null) {
      return;
    }

    let chosenTestEvent: TestEvent | null = null;

    // Select first failed event by default
    if (testRecording.result === "failed") {
      chosenTestEvent =
        findLast(main, testEvent => testEvent.type === "user-action" && !!testEvent.data.error) ??
        null;
    }

    // Or just select first event
    if (chosenTestEvent === null) {
      chosenTestEvent =
        beforeAll[0] ?? beforeEach[0] ?? main[0] ?? afterEach[0] ?? afterAll[0] ?? null;
    }

    if (chosenTestEvent !== null) {
      selectTestEvent(chosenTestEvent);
    }
  }, [
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    main,
    selectTestEvent,
    testRecording.events,
    testRecording.result,
  ]);

  const toggleStepDetailsPanel = () => {
    const panel = stepDetailsPanelRef.current;
    if (panel) {
      const collapsed = panel.isCollapsed();
      if (collapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  return (
    <>
      <div className={styles.Header}>
        <div className={styles.SummaryRow}>
          <button
            className={styles.BackButton}
            onClick={() => setTestRecording(null)}
            data-test-name="TestRecordingBackButton"
          >
            <MaterialIcon className={styles.Chevron}>chevron_left</MaterialIcon>
          </button>
          <div className={styles.Title} title={testRecording.source.title}>
            {testRecording.source.title}
          </div>
          <div className={styles.ResultIconAndLabel} data-status="passed">
            <TestResultIcon result={testRecording.result} />
          </div>
        </div>
      </div>
      <div className={styles.Body} data-test-id="TestRecordingPanelBody">
        <PanelGroup autoSaveId="TestRecordingPanel" direction="vertical">
          <ResizablePanel className={styles.TestEventsPanel} collapsible>
            <div className={styles.TestEventsContainer}>
              {testSections.map(([testSectionName, title, testEvents]) => (
                <TestSection
                  key={testSectionName}
                  testEvents={testEvents}
                  testSectionName={testSectionName}
                  testRunnerName={testRecording.testRunnerName}
                  title={title}
                />
              ))}
              {testRecording.error && <TestError error={testRecording.error} />}
            </div>
          </ResizablePanel>
          <PanelResizeHandle className={styles.ResizeHandle}>
            <div className={styles.ResizeHandleBar} />
          </PanelResizeHandle>
          <ResizablePanel
            className={styles.TestEventDetailsPanel}
            collapsible
            defaultSize={35}
            minSize={10}
            onCollapse={() => setStepDetailsPanelCollapsed(true)}
            onExpand={() => setStepDetailsPanelCollapsed(false)}
            ref={stepDetailsPanelRef}
          >
            <div className={styles.TestEventDetailsContainer}>
              <div className={styles.TestEventDetailsHeader} onClick={toggleStepDetailsPanel}>
                <CollapseExpandArrow collapsed={stepDetailsPanelCollapsed} /> Details
              </div>
              <TestEventDetails collapsed={stepDetailsPanelCollapsed} />
            </div>
          </ResizablePanel>
        </PanelGroup>
      </div>
    </>
  );
}

// TODO This should be a shared component;
// we use this style in a bunch of places.
function CollapseExpandArrow({ collapsed }: { collapsed: boolean }) {
  return <div className={`img arrow ${collapsed ? "" : "expanded"}`} />;
}
