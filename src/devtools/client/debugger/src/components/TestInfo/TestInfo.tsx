import { SourceLocation } from "graphql";
import { useState } from "react";

import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useFetchCypressSpec } from "ui/hooks/useFetchCypressSpec";
import { getRecordingDuration } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem, TestResult, TestStep } from "ui/types";
import { getFormattedTime } from "ui/utils/timeline";

import { selectLocation } from "../../actions/sources";
import { getThreadContext } from "../../selectors";

export default function TestInfo({
  spec,
  testCases,
  result,
}: {
  testCases: TestItem[];
  spec?: string;
  result?: TestResult;
}) {
  const recordingDuration = useAppSelector(getRecordingDuration);
  const cypressResults = useFetchCypressSpec();

  return (
    <div className="flex flex-col space-y-1 px-4 py-2">
      {testCases.map((t, i) => (
        <TestCase test={t} key={i} location={cypressResults?.[i]?.location} />
      ))}
    </div>
  );
}

function TestCase({ test, location }: { test: TestItem; location?: SourceLocation }) {
  const [expandSteps, setExpandSteps] = useState(false);
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getThreadContext);
  const expandable = test.steps || test.error;

  const onClick = () => {
    if (location) {
      dispatch(selectLocation(cx, location as any));
    }
  };
  const toggleExpand = () => {
    if (!expandable) {
      return;
    }
    setExpandSteps(!expandSteps);
  };

  return (
    <div className="flex flex-col">
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
              <div className="mt-1 overflow-hidden rounded-lg bg-testsuitesErrorBgcolor py-1 px-2 text-left">
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
      </div>
      {expandSteps ? <TestSteps test={test} startTime={test.relativeStartTime} /> : null}
    </div>
  );
}

function TestSteps({ test, startTime }: { test: TestItem; startTime: number }) {
  const { steps, error } = test;

  return (
    <div className="flex flex-col rounded-lg py-2 pl-11">
      {steps?.map((s, i) => (
        <div
          key={i}
          className="flex items-center justify-between overflow-hidden border-b border-themeBase-90 bg-testsuitesStepsBgcolor px-3 py-2"
        >
          <div className="flex items-center space-x-2 overflow-hidden whitespace-pre">
            <div className="overflow-hidden overflow-ellipsis font-medium text-bodyColor">
              {s.name}
            </div>
            <div className="overflow-hidden whitespace-pre opacity-70">
              {s.args?.length ? `${s.args.toString()}` : ""}
            </div>
          </div>
          {/* <div>{getFormattedTime(s.relativeStartTime)}</div> */}
        </div>
      ))}
      {test.error ? (
        <div className="border-l-2 border-red-500 bg-testsuitesErrorBgcolor text-testsuitesErrorColor">
          <div className="flex flex-row items-center space-x-1 p-2">
            <Icon filename="warning" size="small" className="bg-testsuitesErrorColor" />
            <div className="font-bold">Error</div>
          </div>
          <div className="wrap space-y-1 overflow-hidden bg-testsuitesErrorBgcolor p-2 font-mono">
            {test.error.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Status({ result }: { result: TestResult }) {
  return (
    <Icon
      filename={result === "passed" ? "testsuites-success" : "testsuites-fail"}
      size="small"
      className={result === "passed" ? "bg-[#219653]" : "bg-[#EB5757]"}
    />
  );
}
