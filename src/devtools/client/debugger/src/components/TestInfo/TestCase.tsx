import classnames from "classnames";
import { createContext, useCallback, useEffect, useState } from "react";

import {
  seek,
  seekToTime,
  setFocusRegionFromTimeRange,
  startPlayback,
  syncFocusedRegion,
  updateFocusRegionParam,
} from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import {
  getReporterAnnotationsForTitleEnd,
  getSelectedTest,
  setSelectedTest,
} from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem, TestResult, TestStep } from "ui/types";

import { TestSteps } from "./TestSteps";

export type TestCaseContextType = {
  test: TestItem;
  startTime: number;
  endTime: number;
  onReplay: () => void;
  onPlayFromHere: (startTime: number) => void;
};

function formatStepError(step?: TestStep) {
  if (!step || !step.error || !step.args) {
    return null;
  }

  return (
    <>
      <strong className="bold">Error:</strong>&nbsp;
      {step.args.map((e, i) => (typeof e === "string" ? <span key={i}>{e}&nbsp;</span> : null))}
    </>
  );
}

export const TestCaseContext = createContext<TestCaseContextType>(null as any);

export function TestCase({ test, index }: { test: TestItem; index: number }) {
  const [expandSteps, setExpandSteps] = useState(false);
  const dispatch = useAppDispatch();
  const expandable = test.steps || test.error;
  const selectedTest = useAppSelector(getSelectedTest);
  const isSelected = selectedTest === index;
  const annotationsEnd = useAppSelector(getReporterAnnotationsForTitleEnd);

  const testStartTime = test.relativeStartTime || 0;
  const testEndTime = testStartTime + (test.duration || 0);

  const onFocus = () => {
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
  };
  const toggleExpand = () => {
    dispatch(setSelectedTest({ index, title: test.title }));

    onFocus();
  };

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
    if (isSelected) {
      setExpandSteps(true);
      seekToFirstStep();
    } else {
      setExpandSteps(false);
    }
  }, [isSelected, seekToFirstStep]);

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
        {!isSelected && (
          <button
            className={classnames(
              "flex flex-row items-center justify-between gap-1 rounded-lg p-1 transition",
              {
                "group hover:cursor-pointer": expandable,
              }
            )}
            onClick={toggleExpand}
            disabled={!expandable}
          >
            <div className="flex flex-grow flex-row gap-1 overflow-hidden">
              <Status result={test.result} />
              <div className="flex flex-col items-start text-bodyColor">
                <div
                  className={`overflow-hidden overflow-ellipsis whitespace-pre ${"group-hover:underline"}`}
                >
                  {test.title}
                </div>
                {test.error ? (
                  <div
                    className="mt-2 overflow-hidden rounded-lg bg-testsuitesErrorBgcolor px-3 py-2 text-left font-mono"
                    data-test-id="TestSuite-TestCaseRow-Error"
                  >
                    {formatStepError(test.steps?.find(s => s.error)) || test.error.message}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="invisible flex self-start group-hover:visible">
              <MaterialIcon>chevron_right</MaterialIcon>
            </div>
          </button>
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
