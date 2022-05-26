import { useContext } from "react";
import { useSelector } from "react-redux";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Test, useGetTestsForWorkspace } from "ui/hooks/tests";
import { getWorkspaceId } from "ui/reducers/app";
import { LibraryContext } from "../useFilters";
import styles from "../Library.module.css";

export function Tests() {
  const workspaceId = useSelector(getWorkspaceId);
  const { setPreview } = useContext(LibraryContext);
  const { tests, loading } = useGetTestsForWorkspace(workspaceId!);

  if (loading) {
    return <div>Loading…</div>;
  }

  return (
    <>
      <div
        className={`recording-list flex flex-col overflow-y-auto rounded-md text-sm shadow-md ${styles.recordingList}`}
      >
        {tests?.map((t, i) => (
          <TestRow test={t} key={i} onClick={() => setPreview({ id: t.path, view: "tests" })} />
        ))}
      </div>
    </>
  );
}

function TestRow({ test, onClick }: { test: Test; onClick: () => void }) {
  const { path, recordings } = test;

  const results = test.recordings.map(r => r.metadata?.test?.result);

  // Todo: Have a separate treatment for the "timedOut" result.
  return (
    <div
      className="flex flex-row cursor-pointer border-b border-themeBorder flex-grow overflow-hidden py-3 px-4 items-center space-x-4 justify-between"
      onClick={onClick}
    >
      <div className="flex space-x-4 items-center">
        <div className="flex flex-col space-y-0.5">
          <div>
            {path[path.length - 2]} ({recordings.length})
          </div>
          <div className="font-light text-gray-400 flex items-center space-x-1">
            <MaterialIcon>description</MaterialIcon>
            <div>{path.slice(1).join(" > ")}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-row space-x-1 h-5">
        {results.length < 10
          ? new Array(10 - results.length)
              .fill("")
              .map((_, i) => <div key={i} className={`h-full w-2 bg-gray-300`} />)
          : null}
        {results.map((r, i) => (
          <div key={i} className={`h-full w-2 ${r === "passed" ? "bg-green-500" : "bg-red-500"}`} />
        ))}
      </div>
    </div>
  );
}
