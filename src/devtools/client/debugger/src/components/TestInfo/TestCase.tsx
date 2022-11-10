import { Location } from "@replayio/protocol";
import { useEffect, useState } from "react";

import { getRecordingDuration } from "ui/actions/app";
import { setFocusRegion } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem, TestResult } from "ui/types";

import { selectLocation } from "../../actions/sources";
import { getThreadContext } from "../../selectors";
import { TestSteps } from "./TestSteps";

export function TestCase({
  test,
  location,
  setHighlightedTest,
  isHighlighted,
}: {
  test: TestItem;
  location?: Location;
  setHighlightedTest: () => void;
  isHighlighted: boolean;
}) {
  const [expandSteps, setExpandSteps] = useState(false);
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getThreadContext);
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
      dispatch(
        setFocusRegion({
          beginTime: testStartTime,
          endTime: testEndTime,
        })
      );
    }
  };

  const onLocationClick = () => {
    if (location) {
      dispatch(selectLocation(cx, location));
    }
  };
  const toggleExpand = () => {
    setHighlightedTest();
    onFocus();

    if (!expandable) {
      return;
    }
  };

  useEffect(() => {
    if (isHighlighted) {
      setExpandSteps(true);
    } else {
      setExpandSteps(false);
    }
  }, [isHighlighted]);

  return (
    <div className="group flex flex-col">
      <div className="group flex flex-row items-center justify-between gap-1 rounded-lg p-1 transition hover:cursor-pointer">
        <button
          onClick={toggleExpand}
          disabled={!expandable}
          className="flex flex-grow flex-row gap-1 overflow-hidden"
        >
          <Status result={test.result} />
          {test.steps ? (
            <MaterialIcon>{expandSteps ? "expand_more" : "chevron_right"}</MaterialIcon>
          ) : null}
          <div className="flex flex-col items-start text-bodyColor">
            <div className="overflow-hidden overflow-ellipsis whitespace-pre">{test.title}</div>
            {test.error ? (
              <div className="mt-1 overflow-hidden rounded-lg bg-testsuitesErrorBgcolor px-2 py-1 text-left font-mono ">
                {test.error.message}
              </div>
            ) : null}
          </div>
        </button>
        <div
          className={`flex gap-1 self-start group-hover:visible ${
            expandSteps ? "visible" : "invisible"
          }`}
        >
          {location ? (
            <button
              onClick={onLocationClick}
              title="Go To Source"
              className="grid h-5 w-5 items-center justify-center hover:bg-menuHoverBgcolor"
            >
              <MaterialIcon>description</MaterialIcon>
            </button>
          ) : null}
              {/* <button
                onClick={onFocus}
                title={isFocused ? "Reset Focus" : "Focus on this test"}
                className={`grid h-5 w-5 items-center justify-center hover:bg-menuHoverBgcolor`}
              >
                <Icon filename="focus" />
              </button> */}
        </div>
      </div>
      {expandSteps ? <TestSteps test={test} startTime={test.relativeStartTime} /> : null}
    </div>
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
