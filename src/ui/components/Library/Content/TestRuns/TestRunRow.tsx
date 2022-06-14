import { TestRun } from "ui/hooks/tests";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getTruncatedRelativeDate } from "../../RecordingRow";
import { useContext } from "react";
import { LibraryContext } from "../../useFilters";
import { getDuration, getDurationString } from "./utils";
import { ResultBar } from "../Tests/ResultBar";

function PrimaryInfo({ testRun }: { testRun: TestRun }) {
  return (
    <div>
      {testRun.commit?.title || "Unknown"} ({testRun.commit.id})
    </div>
  );
}
function SecondaryInfo({ testRun }: { testRun: TestRun }) {
  const { recordings, branch, date } = testRun;
  const user = testRun.recordings[0].metadata.source?.trigger?.user;

  const duration = getDuration(testRun.recordings);
  const durationString = getDurationString(duration);

  return (
    <div className="flex flex-row items-center space-x-4 text-xs font-light text-gray-500">
      <div className="flex flex-row items-center space-x-1">
        <MaterialIcon>fork_right</MaterialIcon>
        <div>{branch}</div>
      </div>
      <div className="flex flex-row items-center space-x-1">
        <MaterialIcon>schedule</MaterialIcon>
        <div>{getTruncatedRelativeDate(date)}</div>
      </div>
      <div className="flex flex-row items-center space-x-1">
        <MaterialIcon>timer</MaterialIcon>
        <div>{durationString}</div>
      </div>
      <div>{user || "unknown"}</div>
      {recordings[0].metadata.source?.merge ? (
        <div
          className="flex flex-row items-center space-x-1"
          title={recordings[0].metadata.source.merge.title}
        >
          <div className="font-bold">PR</div>
          <div>{recordings[0].metadata.source.merge.id}</div>
        </div>
      ) : null}
    </div>
  );
}

export function TestRunRow({ testRun, onClick }: { testRun: TestRun; onClick: () => void }) {
  const { preview, setPreview } = useContext(LibraryContext);
  const results = testRun.recordings.map(r => r.metadata?.test?.result);

  const displayedRecordings = testRun.recordings.filter(r => r.metadata?.test?.result);
  const longestDuration = Math.max(...testRun.recordings.map(r => r.duration));

  const failCount = testRun.recordings.filter(r => r.metadata.test?.result !== "passed").length;
  const isSelected = preview?.id.toString() === testRun.id;

  // Todo: Have a separate treatment for the "timedOut" result.
  return (
    <div
      className={`flex flex-row items-center flex-grow px-4 py-3 overflow-hidden border-b cursor-pointer border-themeBorder space-x-4 ${
        isSelected ? "bg-blue-100" : ""
      }`}
      onClick={onClick}
    >
      <div className="grid items-center justify-center w-8 h-8 font-medium text-red-700 bg-gray-200 rounded-md">
        {failCount}
      </div>
      <div className="flex flex-col flex-grow space-y-1">
        <div className="flex flex-row justify-between space-x-4">
          <PrimaryInfo testRun={testRun} />
          <SecondaryInfo testRun={testRun} />
        </div>
        <div className="flex flex-row h-4 space-x-0.5 items-end overflow-hidden">
          {displayedRecordings.map((r, i) => (
            <ResultBar recording={r} key={i} maxDuration={longestDuration} />
          ))}
        </div>
      </div>
    </div>
  );
}
