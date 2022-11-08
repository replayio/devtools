import { Location } from "@replayio/protocol";
import { useState } from "react";

import { setFocusRegion } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem, TestResult } from "ui/types";

import { selectLocation } from "../../actions/sources";
import { getThreadContext } from "../../selectors";
import { TestSteps } from "./TestSteps";

export function TestCase({ test, location }: { test: TestItem; location?: Location }) {
  const [expandSteps, setExpandSteps] = useState(false);
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getThreadContext);
  const expandable = test.steps || test.error;

  const onClick = () => {
    if (location) {
      dispatch(selectLocation(cx, location));
    }
  };
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
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between gap-1 p-1 transition rounded-lg group hover:cursor-pointer">
        <button
          onClick={toggleExpand}
          disabled={!expandable}
          className="flex flex-row flex-grow gap-1 overflow-hidden"
        >
          <Status result={test.result} />
          {test.steps ? (
            <MaterialIcon>{expandSteps ? "expand_more" : "chevron_right"}</MaterialIcon>
          ) : null}

          <div className="flex flex-col items-start text-bodyColor">
            <div className="overflow-hidden whitespace-pre overflow-ellipsis">{test.title}</div>

            {test.error ? (
              <div className="px-2 py-1 mt-1 overflow-hidden font-mono text-left rounded-lg bg-testsuitesErrorBgcolor ">
                {test.error.message}
              </div>
            ) : null}
          </div>
        </button>
        {location ? (
          <button onClick={onClick} title="Go To Source">
            <MaterialIcon>description</MaterialIcon>
          </button>
        ) : null}
        <button onClick={onFocus} title="Go To Source">
          <MaterialIcon>center_focus_strong</MaterialIcon>
        </button>
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
