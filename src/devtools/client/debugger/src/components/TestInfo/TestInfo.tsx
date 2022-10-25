import { SourceLocation } from "graphql";
import { useState } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useFetchCypressSpec } from "ui/hooks/useFetchCypressSpec";
import { getRecordingDuration } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem, TestResult } from "ui/types";
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
      <div className="flex flex-col px-4 py-2 space-y-1">
        {testCases.map((t, i) => (
          <TestCase test={t} key={i} location={cypressResults?.[i]?.location} />
        ))}
      </div>
    </div>
  );
}

function TestCase({ test, location }: { test: TestItem; location?: SourceLocation }) {
  const [expandError, setExpandError] = useState(false);
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getThreadContext);

  const onClick = () => {
    if (location) {
      dispatch(selectLocation(cx, location as any));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        className="flex flex-row items-center gap-1 group"
        onClick={onClick}
        disabled={!location}
      >
        <Status result={test.result} />
        <div
          className={`overflow-hidden whitespace-pre overflow-ellipsis ${
            location ? "group-hover:underline" : ""
          }`}
        >
          {test.title}
        </div>
      </button>
      {test.error ? (
        <div className="space-y-1 ml-7">
          <div className={`font-mono overflow-hidden ${!expandError ? "truncate" : ""}`}>
            {test.error.message}
          </div>
          <button className="hover:underline" onClick={() => setExpandError(!expandError)}>
            Show {expandError ? "less" : "more"}
          </button>
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
      {result === "passed" ? "check_circle" : "highlight_off"}
    </MaterialIcon>
  );
}
