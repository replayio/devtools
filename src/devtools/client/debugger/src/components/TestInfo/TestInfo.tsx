import { SourceLocation } from "graphql";
import { useState } from "react";

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
      <div className="group flex flex-row items-center justify-between gap-1 py-1 transition hover:bg-chrome">
        <button
          onClick={toggleExpand}
          disabled={!expandable}
          className="flex flex-grow flex-row items-center gap-1 overflow-hidden"
        >
          <Status result={test.result} />
          {test.steps ? (
            <MaterialIcon>{expandSteps ? "expand_more" : "chevron_right"}</MaterialIcon>
          ) : null}
          <div className="flex flex-col items-start">
            <div className="overflow-hidden overflow-ellipsis whitespace-pre">{test.title}</div>
            {test.error ? (
              <div className="overflow-hidden font-mono text-red-500">{test.error.message}</div>
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
    <div className="flex flex-col py-2 pl-4">
      {steps?.map((s, i) => (
        <div
          key={i}
          className="flex items-center justify-between overflow-hidden border-b border-gray-300 bg-chrome px-2 py-1"
        >
          <div className="flex items-center space-x-2 overflow-hidden whitespace-pre font-mono">
            <div className="overflow-hidden overflow-ellipsis">{s.name}</div>
            <div className="overflow-hidden whitespace-pre opacity-50">
              {s.args?.length ? `${s.args.toString()}` : ""}
            </div>
          </div>
          {/* <div>{getFormattedTime(s.relativeStartTime)}</div> */}
        </div>
      ))}
      {test.error ? (
        <div className="border-l-2 border-red-800 bg-red-200 text-red-700">
          <div className="p-2 font-bold">Error</div>
          <div className="space-y-1 overflow-hidden truncate bg-red-100 p-2 font-mono">
            {test.error.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Status({ result }: { result: TestResult }) {
  return (
    <MaterialIcon
      iconSize="2xl"
      outlined
      className={result === "passed" ? "text-green-500" : "text-red-500"}
    >
      {result === "passed" ? "done" : "close"}
    </MaterialIcon>
  );
}
