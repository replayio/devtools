import { TestRunListItem } from "./TestRunListItem";
import { useGetTestRuns } from "./useGetTestRuns";

export function TestRunList() {
  const { results, loading } = useGetTestRuns();

  if (loading) {
    return (
      <div className="flex flex-col flex-grow p-4 space-y-2 overflow-auto bg-sky-200">Loading</div>
    );
  }

  return (
    <div className="flex flex-col flex-grow p-4 space-y-2 overflow-auto bg-sky-200">
      {results.map((t, i) => (
        <TestRunListItem key={i} testRun={t} />
      ))}
    </div>
  );
}
