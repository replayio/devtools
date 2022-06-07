import { TestRun } from "ui/hooks/tests";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getRelativeDate } from "../../RecordingRow";
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
  const { recordings, event, branch, date } = testRun;
  const user = testRun.recordings[0].metadata.source?.trigger?.user;

  const duration = getDuration(testRun.recordings);
  const durationString = getDurationString(duration);

  return (
    <div className="flex flex-row items-center space-x-4 text-xs font-light text-gray-500">
      <div>{event}</div>
      <div className="flex flex-row items-center space-x-1">
        <MaterialIcon>schedule</MaterialIcon>
        <div>{getRelativeDate(date)}</div>
      </div>
      <div className="flex flex-row items-center space-x-1">
        <MaterialIcon>timer</MaterialIcon>
        <div>{durationString}</div>
      </div>
      <div className="flex flex-row items-center space-x-1">
        <MaterialIcon>fork_right</MaterialIcon>
        <div>{branch}</div>
      </div>
      {!!user && (
        <img title={user} className="w-4 h-4 rounded-full" src={`https://github.com/${user}.png`} />
      )}
      {recordings[0].metadata.source?.merge ? (
        <div
          className="flex flex-row items-center space-x-1"
          title={recordings[0].metadata.source.merge.title}
        >
          <MaterialIcon>tag</MaterialIcon>
          <div>{recordings[0].metadata.source.merge.id}</div>
        </div>
      ) : null}
    </div>
  );
}

export function TestRunRow({
  testRun,
  onClick,
}: {
  testRun: TestRun;
  onClick: () => void;
}) {
  const { preview, setPreview } = useContext(LibraryContext);
  const results = testRun.recordings.map(r => r.metadata?.test?.result);

  const displayedRecordings = testRun.recordings.filter(r => r.metadata?.test?.result);
  const longestDuration = Math.max(...testRun.recordings.map(r => r.duration));

  const isSelected = preview?.id.toString() === testRun.id;

  // Todo: Have a separate treatment for the "timedOut" result.
  return (
    <div
      className={`flex flex-row items-center flex-grow px-4 py-3 overflow-hidden border-b cursor-pointer border-themeBorder space-x-2 ${
        isSelected ? "bg-blue-100" : ""
      }`}
      onClick={onClick}
    >
      <MaterialIcon
        iconSize="2xl"
        className={results.every(r => r === "passed") ? "text-green-500" : "text-red-500"}
      >
        {results.every(r => r === "passed") ? "check_circle" : "error"}
      </MaterialIcon>
      <div className="flex flex-row items-center flex-grow space-x-2">
        <div className="flex flex-col space-y-1">
          <div className="flex flex-col space-y-0.5">
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
      <div className="flex flex-row space-x-2">
        <div className="flex items-center py-1 space-x-0.5 text-green-500 rounded-full">
          <MaterialIcon iconSize="xl">check_circle</MaterialIcon>
          <div>{`${results.filter(r => r === "passed").length}`}</div>
        </div>
        {results.filter(r => r === "failed").length === 0 ? null : (
          <div className="flex items-center py-1 space-x-0.5 text-red-500 rounded-full">
            <MaterialIcon iconSize="xl">error</MaterialIcon>
            <div>{`${results.filter(r => r === "failed").length}`}</div>
          </div>
        )}
      </div>
    </div>
  );
}
