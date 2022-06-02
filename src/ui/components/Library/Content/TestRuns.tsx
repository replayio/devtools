import { useContext } from "react";
import { useSelector } from "react-redux";
import { TestRun, useGetTestRunsForWorkspace } from "ui/hooks/tests";
import { getWorkspaceId } from "ui/reducers/app";
import { LibraryContext } from "../useFilters";
import styles from "../Library.module.css";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getRelativeDate } from "../RecordingRow";

export function TestRuns() {
  const workspaceId = useSelector(getWorkspaceId);
  const { setPreview } = useContext(LibraryContext);
  const { testRuns, loading } = useGetTestRunsForWorkspace(workspaceId!);

  if (loading) {
    return <div>Loading…</div>;
  }

  return (
    <>
      <div
        className={`recording-list flex flex-col overflow-y-auto rounded-md text-sm shadow-md ${styles.recordingList}`}
      >
        {testRuns?.map((t, i) => (
          <TestRunRow
            testRun={t}
            key={i}
            onClick={() => setPreview({ id: t.id, view: "test-runs" })}
          />
        ))}
      </div>
    </>
  );
}

function TestRunRow({ testRun, onClick }: { testRun: TestRun; onClick: () => void }) {
  const { recordings, event, commit, branch } = testRun;
  const results = testRun.recordings.map(r => r.metadata?.test?.result);

  // Todo: Have a separate treatment for the "timedOut" result.
  return (
    <div
      className="flex flex-row items-center justify-between flex-grow px-4 py-3 overflow-hidden border-b cursor-pointer border-themeBorder space-x-r"
      onClick={onClick}
    >
      <div className="flex flex-row space-x-2">
        <MaterialIcon
          iconSize="4xl"
          className={results.every(r => r === "passed") ? "text-green-500" : "text-red-500"}
        >
          {results.every(r => r === "passed") ? "check_circle" : "error"}
        </MaterialIcon>
        <div className="flex flex-col space-y-0.5">
          <div>{commit?.title || "Unknown"} </div>
          <div className="flex flex-row items-center space-x-4 font-light text-gray-400">
            <div>{event}</div>
            <div>{getRelativeDate(recordings[0].date)}</div>
            <div className="flex flex-row items-center space-x-1">
              <MaterialIcon>fork_right</MaterialIcon>
              <div>{commit.id}</div>
            </div>
            <div className="flex flex-row items-center space-x-1">
              <MaterialIcon>fork_right</MaterialIcon>
              <div>{branch}</div>
            </div>
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
        </div>
      </div>
      <div className="flex flex-row space-x-2">
        <div className="flex items-center px-4 py-2 space-x-2 text-green-500 bg-green-100 rounded-3xl">
          <MaterialIcon iconSize="2xl">check_circle</MaterialIcon>
          <div>{`${results.filter(r => r === "passed").length} pass`}</div>
        </div>
        {results.filter(r => r === "failed").length === 0 ? null : (
          <div className="flex items-center px-4 py-2 space-x-2 text-red-500 bg-red-100 rounded-3xl">
            <MaterialIcon iconSize="2xl">error</MaterialIcon>
            <div>{`${results.filter(r => r === "failed").length} fail`}</div>
          </div>
        )}
      </div>
    </div>
  );
}
