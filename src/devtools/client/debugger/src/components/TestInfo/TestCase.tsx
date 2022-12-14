import classnames from "classnames";
import { createContext, useEffect, useState } from "react";

import { getRecordingDuration } from "ui/actions/app";
import {
  seek,
  seekToTime,
  setFocusRegion,
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
import { getFocusRegion } from "ui/reducers/timeline";
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
  const annotationsStart = useAppSelector(getReporterAnnotationsForTitleEnd(test.title));

  const duration = useAppSelector(getRecordingDuration);
  const testStartTime = test.relativeStartTime || 0;
  const testEndTime = testStartTime + (test.duration || 0);
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
    } else if (testEndTime > testStartTime) {
      dispatch(
        setFocusRegion({
          beginTime: testStartTime,
          endTime: testEndTime,
        })
      );
    }
    dispatch(syncFocusedRegion());
    dispatch(updateFocusRegionParam());
  };
  const toggleExpand = () => {
    const firstStep = test.steps?.[0];
    if (test.relativeStartTime != null) {
      if (firstStep?.relativeStartTime != null) {
        const time = firstStep.relativeStartTime + test.relativeStartTime;
        const pointStart = annotationsStart.find(a => a.message.id === firstStep.id)?.point;

        if (time && pointStart) {
          dispatch(seek(pointStart, time, false));
        }
      } else {
        dispatch(seekToTime(test.relativeStartTime, false));
      }
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
                  <div className="mt-2 overflow-hidden rounded-lg bg-testsuitesErrorBgcolor px-3 py-2 text-left font-mono ">
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
