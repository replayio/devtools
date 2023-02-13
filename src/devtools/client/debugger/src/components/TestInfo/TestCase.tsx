import { createContext, useCallback, useEffect, useState } from "react";

import { TestItem, TestResult, TestStep } from "shared/graphql/types";
import {
  seek,
  seekToTime,
  setFocusRegionFromTimeRange,
  startPlayback,
  syncFocusedRegion,
  updateFocusRegionParam,
} from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import { getReporterAnnotationsForTitleEnd, getSelectedTest } from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { TestSteps } from "./TestSteps";
import styles from "src/ui/components/SidePanel.module.css";

export type TestCaseContextType = {
  test: TestItem;
  startTime: number;
  endTime: number;
  onReplay: () => void;
  onPlayFromHere: (startTime: number) => void;
};

export const TestCaseContext = createContext<TestCaseContextType>(null as any);

export function TestCase({ test }: { test: TestItem }) {
  const dispatch = useAppDispatch();
  const annotationsEnd = useAppSelector(getReporterAnnotationsForTitleEnd);

  const testStartTime = test.relativeStartTime || 0;
  const testEndTime = testStartTime + (test.duration || 0);

  const onFocus = useCallback(() => {
    if (testEndTime > testStartTime) {
      dispatch(
        setFocusRegionFromTimeRange({
          begin: testStartTime,
          end: testEndTime,
        })
      );
    }
    dispatch(syncFocusedRegion());
    dispatch(updateFocusRegionParam());
  }, [testStartTime, testEndTime, dispatch]);

  const seekToFirstStep = useCallback(() => {
    const firstStep = test.steps?.[0];
    if (test.relativeStartTime != null) {
      if (firstStep?.relativeStartTime != null) {
        const time = firstStep.relativeStartTime + test.relativeStartTime;
        const pointStart = annotationsEnd.find(a => a.message.id === firstStep.id)?.point;

        if (time && pointStart) {
          dispatch(seek(pointStart, time, false));
        }
      } else {
        dispatch(seekToTime(test.relativeStartTime, false));
      }
    }
  }, [test, annotationsEnd, dispatch]);

  useEffect(() => {
    seekToFirstStep();
    onFocus();
  }, [seekToFirstStep, onFocus]);

  const onReplay = () => {
    dispatch(startPlayback({ beginTime: testStartTime, endTime: testEndTime - 1 }));
  };
  const onPlayFromHere = (beginTime: number) => {
    dispatch(startPlayback({ beginTime, endTime: testEndTime - 1 }));
  };

  return (
    <TestCaseContext.Provider
      value={{ startTime: testStartTime, endTime: testEndTime, onReplay, onPlayFromHere, test }}
    >
      <div className="flex flex-col" data-test-id="TestSuite-TestCaseRow">
        <TestSteps test={test} />
      </div>
    </TestCaseContext.Provider>
  );
}

export function Status({ result }: { result: TestResult }) {
  return (
    <Icon
      filename={result === "passed" ? "testsuites-success" : "testsuites-fail"}
      size="small"
      className={result === "passed" ? styles.SuccessIcon : styles.ErrorIcon}
    />
  );
}
