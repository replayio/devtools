import { createContext, ReactNode, useContext, useState } from "react";
import { useSelector } from "react-redux";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Test, useGetTestsForWorkspace } from "ui/hooks/tests";
import { getWorkspaceId } from "ui/reducers/app";
import { LibraryContext } from "../useFilters";
import styles from "../Library.module.css";
import { getRelativeDate } from "../RecordingRow";
import { Recording } from "ui/types";

type TestsContextType = {
  hoveredRunId: string | null;
  setHoveredRunId: (runId: string | null) => void;
};

export const TestsContext = createContext<TestsContextType>({
  hoveredRunId: null,
  setHoveredRunId: () => {},
});

function TestsContextWrapper({ children }: { children: ReactNode }) {
  const [hoveredRunId, setHoveredRunId] = useState<string | null>(null);

  console.log({ hoveredRunId });
  return (
    <TestsContext.Provider value={{ hoveredRunId, setHoveredRunId }}>
      {children}
    </TestsContext.Provider>
  );
}

export function Tests() {
  const workspaceId = useSelector(getWorkspaceId);
  const { setPreview } = useContext(LibraryContext);
  const { tests, loading } = useGetTestsForWorkspace(workspaceId!);

  if (loading) {
    return <div>Loading…</div>;
  }

  return (
    <TestsContextWrapper>
      <div
        className={`recording-list flex flex-col overflow-y-auto rounded-md text-sm shadow-md ${styles.recordingList}`}
      >
        {tests?.map((t, i) => (
          <TestRow test={t} key={i} onClick={() => setPreview({ id: t.path, view: "tests" })} />
        ))}
      </div>
    </TestsContextWrapper>
  );
}

function TestRow({ test, onClick }: { test: Test; onClick: () => void }) {
  const { path, recordings, date } = test;

  const displayedRecordings = test.recordings.filter(r => r.metadata?.test?.result);

  // Todo: Have a separate treatment for the "timedOut" result.
  return (
    <div
      className="flex flex-col px-4 py-3 space-y-2 border-b cursor-pointer border-themeBorder"
      onClick={onClick}
    >
      <div className="flex flex-col space-y-0.5">
        <div>
          {path[path.length - 1]} ({recordings.length})
        </div>
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <div className="flex flex-row items-center space-x-1">
            <MaterialIcon>web_asset</MaterialIcon>
            <div>{path?.[1]}</div>
          </div>
          <div className="flex flex-row items-center space-x-1">
            <MaterialIcon>description</MaterialIcon>
            <div>{path?.[path.length - 2]}</div>
          </div>
          <div className="flex flex-row items-center space-x-1">
            <MaterialIcon>schedule</MaterialIcon>
            <div>Last run {getRelativeDate(date)}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-row h-4 space-x-0.5">
        {displayedRecordings.map((r, i) => (
          <Result recording={r} key={i} />
        ))}
      </div>
    </div>
  );
}

function Result({ recording }: { recording: Recording }) {
  const { hoveredRunId, setHoveredRunId } = useContext(TestsContext);
  const testRunId = recording.metadata?.test?.run?.id || null;

  const onMouseEnter = () => {
    const runId = recording.metadata.test?.run?.id;

    if (runId) {
      setHoveredRunId(runId);
    }
  };
  const onMouseLeave = () => setHoveredRunId(null);
  const shouldFade = hoveredRunId && testRunId !== hoveredRunId;

  return (
    <div
      className={`h-full w-1.5 ${
        shouldFade
          ? "bg-gray-300"
          : recording.metadata.test!.result === "passed"
          ? "bg-green-500"
          : "bg-red-500"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}
