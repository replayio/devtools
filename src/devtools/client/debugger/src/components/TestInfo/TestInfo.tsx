import { SourceLocation } from "graphql";
import { useState } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import Icon from "ui/components/shared/Icon";
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

  console.log({ testCases });

  return (
    <div className="flex flex-col px-4 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          {/* {result ? <Status result={result} /> : null} */}
          <div className="overflow-hidden">            
            <TestResultsSummary testCases={testCases} />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        {testCases.map((t, i) => (
          <TestCase test={t} key={i} location={cypressResults?.[i]?.location} />
        ))}
      </div>
    </div>
  );
}

function TestResultsSummary({ testCases }: { testCases: TestItem[] }) {
  const failed = testCases.filter(c => c.result === "failed").length;
  const passed = testCases.filter(c => c.result === "passed").length;

  return (
    <div className="flex gap-1 px-1 py-1">
      <div className="flex items-center gap-1">
        <MaterialIcon iconSize="lg" outlined className="text-green-500">
          done
        </MaterialIcon>
        <div>{passed}</div>
      </div>
      <div className="flex items-center gap-1">
        <MaterialIcon iconSize="lg" outlined className="text-red-500">
          close
        </MaterialIcon>
        <div>{failed}</div>
      </div>
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
      <div className="flex flex-row items-center justify-between gap-1 p-1 transition group hover:cursor-pointer hover:bg-[#FAFAFA] rounded-lg">
        <button
          onClick={toggleExpand}
          disabled={!expandable}
          className="flex flex-row flex-grow gap-1 overflow-hidden"
        >
          <Status result={test.result} />
          {test.steps ? (            
            <MaterialIcon>{expandSteps ? "expand_more" : "chevron_right"}</MaterialIcon>
          ) : null}
          <div className="flex flex-col items-start">
            <div className="overflow-hidden whitespace-pre overflow-ellipsis">{test.title}</div>
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
    <div className="flex flex-col py-2 pl-10 rounded-lg">
      {steps?.map((s, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-2 overflow-hidden border-b border-gray-100 bg-[#FAFAFA]"
        >
          <div className="flex items-center space-x-2 overflow-hidden font-mono whitespace-pre">
            <div className="overflow-hidden overflow-ellipsis">{s.name}</div>
            <div className="overflow-hidden whitespace-pre opacity-50">
              {s.args?.length ? `${s.args.toString()}` : ""}
            </div>
          </div>
          {/* <div>{getFormattedTime(s.relativeStartTime)}</div> */}
        </div>
      ))}
      {test.error ? (
        <div className="text-red-700 bg-red-200 border-l-2 border-red-800">
          <div className="p-2 font-bold">Error</div>
          <div className="p-2 space-y-1 overflow-hidden font-mono truncate bg-red-100">
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
      iconSize="sm"
      outlined
      className={result === "passed" ? "text-[#219653]" : "text-[#EB5757]"}
    >
      {result === "passed" ? "done" : "close"}
    </MaterialIcon>
  );
}
