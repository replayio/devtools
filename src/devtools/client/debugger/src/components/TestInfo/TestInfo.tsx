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
    <div className="flex flex-col px-4 py-2 space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {result ? <Status result={result} /> : null}
          <div className="font-bold">{spec}</div>
        </div>
        {recordingDuration ? <div>{getFormattedTime(recordingDuration)}</div> : null}
      </div>
      <div className="flex flex-col py-2 space-y-1">
        {testCases.map((t, i) => (
          <TestCase test={t} key={i} location={cypressResults?.[i]?.location} />
        ))}
      </div>
    </div>
  );
}

function TestCase({ test, location }: { test: TestItem; location?: SourceLocation }) {
  const [expandError, setExpandError] = useState(false);
  const [expandSteps, setExpandSteps] = useState(false);
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getThreadContext);

  const onClick = () => {
    if (location) {
      dispatch(selectLocation(cx, location as any));
    }
  };
  const toggleExpand = () => {
    setExpandSteps(!expandSteps);
  };
  const expandable = test.steps || test.error;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row items-center justify-between gap-1 pl-4 transition group hover:bg-chrome">
        <button
          onClick={toggleExpand}
          disabled={!expandable}
          className="flex flex-row items-center flex-grow gap-1 overflow-hidden"
        >
          <Status result={test.result} />
          {test.steps ? (
            <MaterialIcon>{expandSteps ? "expand_more" : "chevron_right"}</MaterialIcon>
          ) : null}
          <div
            className={`overflow-hidden whitespace-pre overflow-ellipsis ${
              expandable ? "group-hover:underline" : ""
            }`}
          >
            {test.title}
          </div>
        </button>
        {location ? (
          <button onClick={onClick} title="Go To Source">
            <MaterialIcon>description</MaterialIcon>
          </button>
        ) : null}
      </div>
      {expandSteps ? (
        <>
          {test.error ? (
            <div className="space-y-1 ml-7">
              <div className="font-bold">Error</div>
              <div className="p-2 space-y-1 bg-chrome">
                <div className={`font-mono overflow-hidden ${!expandError ? "truncate" : ""}`}>
                  {test.error.message}
                </div>
                <button className="hover:underline" onClick={() => setExpandError(!expandError)}>
                  Show {expandError ? "less" : "more"}
                </button>
              </div>
            </div>
          ) : null}
          {test.steps ? <TestSteps steps={test.steps} startTime={test.relativeStartTime} /> : null}
        </>
      ) : null}
    </div>
  );
}

function TestSteps({ steps, startTime }: { steps: TestStep[]; startTime: number }) {
  return (
    <div className="flex flex-col pl-8 space-y-1">
      <div className="font-bold">Steps</div>
      <div className="flex flex-col gap-1 p-2 bg-chrome">
        {steps?.map((s, i) => (
          <div key={i} className="flex items-center justify-between overflow-hidden">
            <div className="flex items-center space-x-2 overflow-hidden whitespace-pre">
              <MaterialIcon outlined className={s.error ? "text-red-500" : "text-green-500"}>
                {s.error ? "close" : "done"}
              </MaterialIcon>
              <div className="overflow-hidden overflow-ellipsis">{s.name}</div>
              <div className="overflow-hidden whitespace-pre opacity-50">
                {s.args?.length ? `${s.args.toString()}` : ""}
              </div>
            </div>
            {/* <div>{getFormattedTime(s.relativeStartTime)}</div> */}
          </div>
        ))}
      </div>
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
      {result === "passed" ? "check_circle" : "highlight_off"}
    </MaterialIcon>
  );
}
