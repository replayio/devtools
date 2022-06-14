import { TestRun } from "ui/hooks/tests";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getTruncatedRelativeDate } from "../../RecordingRow";
import { useContext } from "react";
import { LibraryContext } from "../../useFilters";
import { getDuration, getDurationString } from "./utils";
import { ResultBar } from "../Tests/ResultBar";
import Badge from "../Badge";

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
  const { preview } = useContext(LibraryContext);

  const displayedRecordings = testRun.recordings.filter(r => r.metadata?.test?.result);
  const longestDuration = Math.max(...testRun.recordings.map(r => r.duration));

  const isSelected = preview?.id.toString() === testRun.id;

  // Todo: Have a separate treatment for the "timedOut" result.
  return (
    <div
      className={`flex flex-grow cursor-pointer flex-row items-center space-x-4 overflow-hidden border-b border-themeBorder px-4 py-3 ${
        isSelected ? "bg-blue-100" : ""
      }`}
      onClick={onClick}
    >
      <Badge recordings={testRun.recordings} />
      <div className="flex flex-grow flex-col space-y-1">
        <div className="flex flex-row justify-between space-x-4">
          <PrimaryInfo testRun={testRun} />
          <SecondaryInfo testRun={testRun} />
        </div>
        <div className="flex h-4 flex-row items-end space-x-0.5 overflow-hidden">
          {displayedRecordings.map((r, i) => (
            <ResultBar recording={r} key={i} maxDuration={longestDuration} />
          ))}
        </div>
      </div>
    </div>
  );
}
