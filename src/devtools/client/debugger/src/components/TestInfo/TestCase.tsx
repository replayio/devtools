import { createContext, useEffect, useState } from "react";

import { getRecordingDuration } from "ui/actions/app";
import { seekToTime, setFocusRegion, startPlayback } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import { getFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem, TestResult } from "ui/types";

import { TestSteps } from "./TestSteps";

export type TestCaseContextType = {
  startTime: number;
  endTime: number;
  onReplay: () => void;
  onPlayFromHere: (startTime: number) => void;
};

export const TestCaseContext = createContext<TestCaseContextType>(null as any);

export function TestCase({
  test,
  setHighlightedTest,
  isHighlighted,
}: {
  test: TestItem;
  setHighlightedTest: () => void;
  isHighlighted: boolean;
}) {
  const [expandSteps, setExpandSteps] = useState(false);
  const dispatch = useAppDispatch();
  const expandable = test.steps || test.error;

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
      // Note this check shouldn't be required but something seems to be broken (see SCS-289)
      if (!Number.isNaN(testStartTime) && !Number.isNaN(testEndTime)) {
        dispatch(
          setFocusRegion({
            beginTime: testStartTime,
            endTime: testEndTime,
          })
        );
      }
    }
  };
  const toggleExpand = () => {
    const firstStep = test.steps?.[0];
    if (firstStep) {
      dispatch(seekToTime(firstStep.relativeStartTime + test.relativeStartTime));
    }

    setHighlightedTest();
    onFocus();
  };

  useEffect(() => {
    if (isHighlighted) {
      setExpandSteps(true);
    } else {
      setExpandSteps(false);
    }
  }, [isHighlighted]);

  const onReplay = () => {
    dispatch(startPlayback({ beginTime: testStartTime, endTime: testEndTime - 1 }));
  };
  const onPlayFromHere = (beginTime: number) => {
    dispatch(startPlayback({ beginTime, endTime: testEndTime - 1 }));
  };

  return (
    <TestCaseContext.Provider
      value={{ startTime: testStartTime, endTime: testEndTime, onReplay, onPlayFromHere }}
    >
      <div className="flex flex-col">
        {!isHighlighted && (
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
        {expandSteps ? <TestSteps test={test} startTime={test.relativeStartTime} /> : null}
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
