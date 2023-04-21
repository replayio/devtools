import { ExecutionPoint } from "@replayio/protocol";
import { Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ImperativePanelHandle,
  PanelGroup,
  PanelResizeHandle,
  Panel as ResizablePanel,
} from "react-resizable-panels";

import Loader from "replay-next/components/Loader";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { imperativelyGetClosestPointForTime } from "replay-next/src/suspense/ExecutionPointsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { TestResultIcon } from "ui/components/TestSuite/components/TestResultIcon";
import { TestMetadataCache } from "ui/components/TestSuite/suspense/TestMetadataCache";
import { ProcessedTestItem, ProcessedTestStep } from "ui/components/TestSuite/types";
import TestCaseSection from "ui/components/TestSuite/views/TestItem/TestCaseSection";
import { TestError } from "ui/components/TestSuite/views/TestItem/TestError";
import TestStepDetails from "ui/components/TestSuite/views/TestItem/TestStepDetails";
import { useGetRecordingId } from "ui/hooks/recordings";
import { selectTestStep as selectTestStepAction } from "ui/reducers/reporter";
import { getSelectedTestStep } from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import styles from "./Panel.module.css";

export default function Panel({
  clearSelectedTestItem,
  testItem,
}: {
  clearSelectedTestItem: () => void;
  testItem: ProcessedTestItem;
}) {
  return (
    <Suspense fallback={<Loader />}>
      <PanelSuspends clearSelectedTestItem={clearSelectedTestItem} testItem={testItem} />
    </Suspense>
  );
}

function PanelSuspends({
  clearSelectedTestItem,
  testItem,
}: {
  clearSelectedTestItem: () => void;
  testItem: ProcessedTestItem;
}) {
  const replayClient = useContext(ReplayClientContext);
  const { update } = useContext(TimelineContext);

  const dispatch = useAppDispatch();
  const selectedTestStep = useAppSelector(getSelectedTestStep);
  const recordingId = useGetRecordingId();

  const testItemStartTime = testItem.relativeStartTime;

  const stepDetailsPanelRef = useRef<ImperativePanelHandle>(null);

  const [stepDetailsPanelCollapsed, setStepDetailsPanelCollapsed] = useState(false);

  const committedValuesRef = useRef<{ selectedTestStep: ProcessedTestStep | null }>({
    selectedTestStep: null,
  });
  useEffect(() => {
    committedValuesRef.current.selectedTestStep = selectedTestStep;
  });

  // Select a test step and update the current time
  const selectTestStep = useCallback(
    async (testStep: ProcessedTestStep | null) => {
      const { selectedTestStep } = committedValuesRef.current;
      if (selectedTestStep === testStep) {
        return;
      }

      dispatch(selectTestStepAction(testStep));

      if (testItem.relativeStartTime != null && testStep !== null) {
        let time: number | null = testStep.time;
        let executionPoint: ExecutionPoint | null = null;
        switch (testStep.type) {
          case "step":
            const annotation = testStep.data.annotations.end;
            if (annotation != null) {
              executionPoint = annotation.point;
              time = annotation.time;
            }
            break;
        }

        if (executionPoint == null) {
          executionPoint = await imperativelyGetClosestPointForTime(replayClient, time);
        }

        update(time, executionPoint, false);
      }
    },
    [dispatch, replayClient, testItem.relativeStartTime, update]
  );

  const { beforeAll, beforeEach, testBody, afterEach, afterAll } = testItem.sections;
  const testCaseSections: [title: string, testSteps: ProcessedTestStep[]][] = [
    ["before all", beforeAll],
    ["before each", beforeEach],
    ["test body", testBody],
    ["after each", afterEach],
    ["after all", afterAll],
  ];

  // Select a default test step
  useEffect(() => {
    const { selectedTestStep } = committedValuesRef.current;
    if (selectedTestStep !== null) {
      return;
    }

    let chosenTestStep: ProcessedTestStep | null = null;

    // Select first failed step by default
    if (testItem.result === "failed") {
      chosenTestStep =
        testBody.find(testStep => {
          switch (testStep.type) {
            case "step":
              return testStep.data.error != null;
          }
        }) ?? null;
    }

    // Or just select first step
    if (chosenTestStep === null) {
      chosenTestStep =
        beforeAll[0] ?? beforeEach[0] ?? testBody[0] ?? afterEach[0] ?? afterAll[0] ?? null;
    }

    if (chosenTestStep !== null) {
      selectTestStep(chosenTestStep);
    }
  }, [
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    selectTestStep,
    testBody,
    testItem.result,
    testItem.sections,
  ]);

  const testMetadata = TestMetadataCache.read(recordingId);

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
          <button className={styles.BackButton} onClick={clearSelectedTestItem}>
            <MaterialIcon className={styles.Chevron}>chevron_left</MaterialIcon>
          </button>
          <div className={styles.Title} title={testItem.title}>
            {testItem.title}
          </div>
          <div className={styles.ResultIconAndLabel} data-status="passed">
            <TestResultIcon result={testItem.result} />
          </div>
        </div>
      </div>
      <div className={styles.Body} data-test-id="TestItemPanelBody">
        <PanelGroup autoSaveId="TestItemPanel" direction="vertical">
          <ResizablePanel className={styles.TestStepsPanel} collapsible>
            <div className={styles.TestStepsContainer}>
              {testCaseSections.map(([title, testSteps]) => (
                <TestCaseSection
                  key={title}
                  selectedTestStep={selectedTestStep}
                  selectTestStep={selectTestStep}
                  testItem={testItem}
                  testItemStartTime={testItemStartTime}
                  testMetadata={testMetadata}
                  testSteps={testSteps}
                  title={title}
                />
              ))}
              {testItem.error && <TestError error={testItem.error} />}
            </div>
          </ResizablePanel>
          <PanelResizeHandle className={styles.ResizeHandle}>
            <div className={styles.ResizeHandleBar} />
          </PanelResizeHandle>
          <ResizablePanel
            className={styles.TestStepDetailsPanel}
            collapsible
            defaultSize={35}
            onCollapse={collapsed => setStepDetailsPanelCollapsed(collapsed)}
            ref={stepDetailsPanelRef}
          >
            <div className={styles.TestStepDetailsContainer}>
              <div className={styles.TestStepDetailsHeader} onClick={toggleStepDetailsPanel}>
                <CollapseExpandArrow collapsed={stepDetailsPanelCollapsed} /> Step Details
              </div>
              <TestStepDetails
                collapsed={stepDetailsPanelCollapsed}
                processedTestStep={selectedTestStep}
              />
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
