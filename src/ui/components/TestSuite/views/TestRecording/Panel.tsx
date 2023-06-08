import assert from "assert";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ImperativePanelHandle,
  PanelGroup,
  PanelResizeHandle,
  Panel as ResizablePanel,
} from "react-resizable-panels";

import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
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

import styles from "./Panel.module.css";

export default function Panel() {
  const { setTestEvent, setTestRecording, testEvent, testRecording } = useContext(TestSuiteContext);
  const { update } = useContext(TimelineContext);

  assert(testRecording != null);

  const stepDetailsPanelRef = useRef<ImperativePanelHandle>(null);

  const [stepDetailsPanelCollapsed, setStepDetailsPanelCollapsed] = useState(false);

  const committedValuesRef = useRef<{ testEvent: TestEvent | null }>({
    testEvent: null,
  });
  useEffect(() => {
    committedValuesRef.current.testEvent = testEvent;
  });

  // Select a test step and update the current time
  const selectTestEvent = useCallback(
    async (testEvent: TestEvent | null) => {
      if (committedValuesRef.current.testEvent === testEvent) {
        return;
      }

      setTestEvent(testEvent);

      if (testEvent !== null) {
        update(getTestEventTime(testEvent), getTestEventExecutionPoint(testEvent), false);
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
        main.find(testEvent => {
          switch (testEvent.type) {
            case "user-action":
              return testEvent.data.error != null;
          }
        }) ?? null;
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
      const collapsed = panel.getCollapsed();
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
          <button className={styles.BackButton} onClick={() => setTestRecording(null)}>
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
            onCollapse={collapsed => setStepDetailsPanelCollapsed(collapsed)}
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
