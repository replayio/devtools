import { createContext, useEffect, useState } from "react";

import { getRecordingDuration } from "ui/actions/app";
import { seek, setFocusRegion, startPlayback, updateFocusRegionParam } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import {
  getReporterAnnotationsForTitleEnd,
  getSelectedTest,
  setSelectedTest,
} from "ui/reducers/reporter";
import { getFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem, TestResult } from "ui/types";

import { TestSteps } from "./TestSteps";

export type TestCaseContextType = {
  test: TestItem;
  startTime: number;
  endTime: number;
  onReplay: () => void;
  onPlayFromHere: (startTime: number) => void;
};

export const TestCaseContext = createContext<TestCaseContextType>(null as any);

export function TestCase({ test, index }: { test: TestItem; index: number }) {
  const [expandSteps, setExpandSteps] = useState(false);
  const dispatch = useAppDispatch();
  const expandable = test.steps || test.error;
  const selectedTest = useAppSelector(getSelectedTest);
  const isSelected = selectedTest === index;
  const annotationsStart = useAppSelector(getReporterAnnotationsForTitleEnd(test.title));

  const duration = useAppSelector(getRecordingDuration);
  const testStartTime = test.relativeStartTime;
  const testEndTime = test.relativeStartTime + test.duration;
  const focusRegion = useAppSelector(getFocusRegion);
  const isFocused =
    focusRegion?.beginTime === testStartTime && focusRegion?.endTime === testEndTime;

  const onFocus = () => {
    if (isFocused) {
      dispatch(
        setFocusRegion({
          beginTime: 0,
          endTime: duration,
        })
      );
    } else {
      dispatch(
        setFocusRegion({
          beginTime: testStartTime,
          endTime: testEndTime,
        })
      );
    }
    dispatch(updateFocusRegionParam());
  };
  const toggleExpand = () => {
    const firstStep = test.steps?.[0];
    const time = firstStep.relativeStartTime + test.relativeStartTime;
    const pointStart = annotationsStart.find(a => a.message.id === firstStep.id)?.point;

    if (firstStep && time && pointStart) {
      dispatch(seek(pointStart, time, false));
    }

    dispatch(setSelectedTest(index));
    onFocus();
  };

  useEffect(() => {
    if (isSelected) {
      setExpandSteps(true);
    } else {
      setExpandSteps(false);
    }
  }, [isSelected]);

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
      <div className="flex flex-col">
        {!isSelected && (
          <div className="flex flex-row items-center justify-between gap-1 rounded-lg p-1 transition hover:cursor-pointer">
            <button
              onClick={toggleExpand}
              disabled={!expandable}
              className="group flex flex-grow flex-row gap-1 overflow-hidden"
            >
              <Status result={test.result} />
              <div className="flex flex-col items-start text-bodyColor">
                <div
                  className={`overflow-hidden overflow-ellipsis whitespace-pre ${"group-hover:underline"}`}
                >
                  {test.title}
                </div>
                {test.error ? (
                  <div className="mt-1 overflow-hidden rounded-lg bg-testsuitesErrorBgcolor px-2 py-1 text-left font-mono ">
                    {test.error.message}
                  </div>
                ) : null}
              </div>
            </button>
          </div>
        )}
        {expandSteps ? <TestSteps test={test} /> : null}
      </div>
    </TestCaseContext.Provider>
  );
}

export function Status({ result }: { result: TestResult }) {
  return (
    <Icon
      filename={result === "passed" ? "testsuites-success" : "testsuites-fail"}
      size="small"
      className={result === "passed" ? "bg-[#219653]" : "bg-[#EB5757]"}
    />
  );
}
