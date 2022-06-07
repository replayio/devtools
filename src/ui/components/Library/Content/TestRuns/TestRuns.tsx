import { createContext, ReactNode, useContext, useState } from "react";
import { useSelector } from "react-redux";
import { useGetTestRunsForWorkspace } from "ui/hooks/tests";
import { getWorkspaceId } from "ui/reducers/app";
import styles from "../../Library.module.css";
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
  const workspaceId = useSelector(getWorkspaceId);
  const { testRuns, loading } = useGetTestRunsForWorkspace(workspaceId!);

  if (loading) {
    return <div>Loading…</div>;
  }

  return (
    <TestRunsContextWrapper>
      <div
        className={`recording-list flex flex-col overflow-y-auto rounded-md text-sm shadow-md ${styles.recordingList}`}
      >
        {testRuns?.map((t, i) => (
          <TestRunRow testRun={t} key={i} />
        ))}
      </div>
    </TestRunsContextWrapper>
  );
}
