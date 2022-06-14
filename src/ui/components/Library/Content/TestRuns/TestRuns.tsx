import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAppSelector } from "ui/setup/hooks";
import { TestRun, useGetTestRunsForWorkspace } from "ui/hooks/tests";
import { getWorkspaceId } from "ui/reducers/app";
import styles from "../../Library.module.css";
import { LibraryContext } from "../../useFilters";
import { TestRunRow } from "./TestRunRow";

type TestRunsContextType = {
  hoveredRunId: string | null;
  setHoveredRunId: (runId: string | null) => void;
  hoveredRecordingId: string | null;
  setHoveredRecordingId: (runId: string | null) => void;
};

export const TestRunsContext = createContext<TestRunsContextType>({
  hoveredRunId: null,
  setHoveredRunId: () => {},
  hoveredRecordingId: null,
  setHoveredRecordingId: () => {},
});

function TestRunsContextWrapper({ children }: { children: ReactNode }) {
  const [hoveredRunId, setHoveredRunId] = useState<string | null>(null);
  const [hoveredRecordingId, setHoveredRecordingId] = useState<string | null>(null);

  return (
    <TestRunsContext.Provider
      value={{ hoveredRunId, setHoveredRunId, hoveredRecordingId, setHoveredRecordingId }}
    >
      {children}
    </TestRunsContext.Provider>
  );
}

export function TestRuns() {
  const workspaceId = useAppSelector(getWorkspaceId);
  const { testRuns, loading } = useGetTestRunsForWorkspace(workspaceId!);
  const [initialized, setInitialized] = useState(false);
  const { setPreview } = useContext(LibraryContext);

  useEffect(() => {
    if (!loading && testRuns && !initialized) {
      setPreview({
        view: "test-runs",
        id: testRuns[0].id,
        recordingId: testRuns[0].recordings[0].id!,
      });
      setInitialized(true);
    }
  }, [testRuns, loading, initialized, setPreview]);

  if (loading) {
    return <div>Loading…</div>;
  }

  const onClick = (testRun: TestRun) => {
    setPreview({ id: testRun.id, view: "test-runs", recordingId: testRun.recordings[0].id });
  };

  return (
    <TestRunsContextWrapper>
      <div
        className={`recording-list flex flex-col overflow-y-auto rounded-md text-sm shadow-md ${styles.recordingList}`}
      >
        {testRuns?.map((t, i) => (
          <TestRunRow testRun={t} key={i} onClick={() => onClick(t)} />
        ))}
      </div>
    </TestRunsContextWrapper>
  );
}
