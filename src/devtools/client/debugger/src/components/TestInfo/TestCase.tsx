import { Location } from "@replayio/protocol";
import { useState } from "react";

import { setFocusRegion } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem, TestResult } from "ui/types";

import { getThreadContext } from "../../selectors";
import { TestSteps } from "./TestSteps";

export function TestCase({ test, location }: { test: TestItem; location?: Location }) {
  const [expandSteps, setExpandSteps] = useState(false);
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();
  const expandable = test.steps || test.error;
  const isPaused =
    currentTime >= test.relativeStartTime && currentTime < test.relativeStartTime + test.duration;

  const toggleExpand = () => {
    if (!expandable) {
      return;
    }
    setExpandSteps(!expandSteps);
  };

  const onFocus = () => {
    dispatch(
      setFocusRegion({
        beginTime: test.relativeStartTime,
        endTime: test.relativeStartTime + test.duration,
      })
    );
  };

  return (
    <div
      className={`flex flex-col border-t-2 ${
        isPaused ? "border-t-red-500" : "border-t-transparent"
      }`}
    >
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
{    expandSteps ?    <div className="flex gap-1 self-start">
          <button
            onClick={onFocus}
            title="Focus on this test"
            className="grid h-5 w-5 items-center justify-center hover:bg-menuHoverBgcolor"
          >
            <Icon filename="focus" />
          </button>
        </div> : null}
      </div>
      {expandSteps ? <TestSteps test={test} startTime={test.relativeStartTime} location={location} /> : null}
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
