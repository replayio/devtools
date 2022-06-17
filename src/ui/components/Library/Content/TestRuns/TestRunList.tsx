import { useContext, useEffect } from "react";
import { useAppSelector } from "ui/setup/hooks";
import { TestRun, useGetTestRunsForWorkspace } from "ui/hooks/tests";
import { getWorkspaceId } from "ui/reducers/app";
import { LibraryContext } from "../../useFilters";
import { TestRunListItem } from "./TestRunListItem";

export function TestRunList() {
  const workspaceId = useAppSelector(getWorkspaceId);
  const { initialTestRunId } = useContext(LibraryContext);
  const { preview } = useContext(LibraryContext);
  const { testRuns, loading } = useGetTestRunsForWorkspace(workspaceId!);
  const { setPreview } = useContext(LibraryContext);

  useEffect(() => {
    if (!loading && testRuns && !preview) {
      let testRunId;

      // Check that we have a test run that corresponds with the provided test run id
      // from the URL. If not, use the first test run.
      if (initialTestRunId && testRuns.some(run => run.id === initialTestRunId)) {
        testRunId = initialTestRunId;
      } else {
        testRunId = testRuns[0].id;
      }

      setPreview({
        view: "test-runs",
        id: testRunId,
      });
    }
  }, [testRuns, loading, preview, setPreview, initialTestRunId]);

  if (loading) {
    return <div>Loading…</div>;
  }

  const onClick = (testRun: TestRun) => {
    setPreview({ id: testRun.id, view: "test-runs" });
  };

  return (
    <div className="recording-list flex flex-col space-y-0 overflow-y-auto text-sm shadow-md rounded-xl">
      {testRuns?.map((t, i) => (
        <TestRunListItem testRun={t} key={i} onClick={() => onClick(t)} />
      ))}
    </div>
  );
}
