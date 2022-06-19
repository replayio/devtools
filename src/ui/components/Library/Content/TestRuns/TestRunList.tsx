import { useContext, useEffect, useState } from "react";
import { useAppSelector } from "ui/setup/hooks";
import { TestRun, useGetTestRunsForWorkspace } from "ui/hooks/tests";
import { getWorkspaceId } from "ui/reducers/app";
import { LibraryContext } from "../../useFilters";
import { TestRunListItem } from "./TestRunListItem";

export function TestRunList() {
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
    <div className="recording-list flex flex-col space-y-1 overflow-y-auto   text-sm shadow-md">
      {testRuns?.map((t, i) => (
        <TestRunListItem testRun={t} key={i} onClick={() => onClick(t)} />
      ))}
    </div>
  );
}
