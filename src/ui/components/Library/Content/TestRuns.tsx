import { useContext } from "react";
import { useSelector } from "react-redux";
import { TestRun, useGetTestRunsForWorkspace } from "ui/hooks/tests";
import { getWorkspaceId } from "ui/reducers/app";
import { LibraryContext } from "../useFilters";
import styles from "../Library.module.css";
import MaterialIcon from "ui/components/shared/MaterialIcon";

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
  const { id, recordings } = testRun;
  const results = testRun.recordings.map(r => r.metadata?.test?.result);

  // Todo: Have a separate treatment for the "timedOut" result.
  return (
    <div
      className="flex flex-row items-center justify-between cursor-pointer border-b border-themeBorder flex-grow overflow-hidden py-3 px-4 space-x-r"
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
          <div>Deploy PR ({id})</div>
          <div className="flex flex-row space-x-4 items-center text-gray-400 font-light">
            <div className="flex flex-row space-x-1 items-center">
              <MaterialIcon>merge</MaterialIcon>
              <div>{recordings[0].metadata.source?.commit.id.slice(0, 7)}</div>
            </div>
            <div>{new Date(recordings[0].date).toDateString()}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-row space-x-2">
        <div className="bg-green-100 text-green-500 px-4 py-2 rounded-3xl flex space-x-2 items-center">
          <MaterialIcon iconSize="2xl">check_circle</MaterialIcon>
          <div>{`${results.filter(r => r === "passed").length} pass`}</div>
        </div>
        <div className="bg-red-100 text-red-500 px-4 py-2 rounded-3xl flex space-x-2 items-center">
          <MaterialIcon iconSize="2xl">error</MaterialIcon>
          <div>{`${results.filter(r => r === "failed").length} fail`}</div>
        </div>
      </div>
    </div>
  );
}
