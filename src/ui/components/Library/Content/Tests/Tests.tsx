import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Test, useGetTestsForWorkspace } from "ui/hooks/tests";
import { getWorkspaceId } from "ui/reducers/app";
import { LibraryContext } from "../../useFilters";
import styles from "../../Library.module.css";
import { TestRow } from "./TestRow";

type TestsContextType = {
  hoveredRunId: string | null;
  setHoveredRunId: (runId: string | null) => void;
  hoveredRecordingId: string | null;
  setHoveredRecordingId: (runId: string | null) => void;
};

export const TestsContext = createContext<TestsContextType>({
  hoveredRunId: null,
  setHoveredRunId: () => {},
  hoveredRecordingId: null,
  setHoveredRecordingId: () => {},
});

function TestsContextWrapper({ children }: { children: ReactNode }) {
  const [hoveredRunId, setHoveredRunId] = useState<string | null>(null);
  const [hoveredRecordingId, setHoveredRecordingId] = useState<string | null>(null);

  return (
    <TestsContext.Provider
      value={{ hoveredRunId, setHoveredRunId, hoveredRecordingId, setHoveredRecordingId }}
    >
      {children}
    </TestsContext.Provider>
  );
}

export function Tests() {
  const workspaceId = useSelector(getWorkspaceId);
  const [initialized, setInitialized] = useState(false);
  const { setPreview } = useContext(LibraryContext);
  const { tests, loading } = useGetTestsForWorkspace(workspaceId!);

  useEffect(() => {
    if (!loading && tests && !initialized) {
      setPreview({ view: "tests", id: tests[0].path, recordingId: tests[0].recordings[0].id! });
      setInitialized(true);
    }
  }, [tests, loading, initialized, setPreview]);

  if (loading) {
    return <div>Loading…</div>;
  }

  const onClick = (test: Test) => {
    setPreview({ id: test.path, view: "tests", recordingId: test.recordings[0].id });
  };

  return (
    <TestsContextWrapper>
      <div
        className={`recording-list flex flex-col overflow-y-auto rounded-md text-sm shadow-md ${styles.recordingList}`}
      >
        {tests?.map((t, i) => (
          <TestRow test={t} key={i} onClick={() => onClick(t)} />
        ))}
      </div>
    </TestsContextWrapper>
  );
}
