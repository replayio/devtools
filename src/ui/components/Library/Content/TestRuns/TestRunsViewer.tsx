import { useRouter } from "next/router";
import { createContext, useContext, useEffect, useState } from "react";
import { getWorkspaceId } from "ui/actions/app";
import Spinner from "ui/components/shared/Spinner";
import { useGetTestRunsForWorkspace } from "ui/hooks/tests";
import { useAppSelector } from "ui/setup/hooks";
import { TestRunOverview } from "../../Overview/TestRunOverview";
import { TestRunList } from "./TestRunList";

type TestRunsContextType = {
  setSelectedRunIndex: (index: number) => void;
  selectedRunIndex: number;
  // Deriving this at the top level so we don't have to pass the testRuns down through context
  selectedRunId: string | null;
};
export const TestRunsContext = createContext<TestRunsContextType>({
  selectedRunIndex: 0,
  setSelectedRunIndex: () => {},
  selectedRunId: null,
});

// This is not pretty but it gets the job done. There's a restructuring of how we
// think about pages/routes if we were to do this the right way. Todo: That.
export function useGetTestParams() {
  const { query } = useRouter();
  const [workspaceId, view, testRunId] = Array.isArray(query.id) ? query.id : [query.id];

  return { testRunId };
}

export function TestRunsViewer() {
  const { testRunId } = useGetTestParams();
  const [selectedRunIndex, setSelectedRunIndex] = useState<number>(
    testRunId ? Number(testRunId) : 0
  );
  const workspaceId = useAppSelector(getWorkspaceId);
  const { testRuns, loading } = useGetTestRunsForWorkspace(workspaceId!);

  useEffect(() => {
    if (testRuns) {
      const routeRunIndex = testRuns.findIndex(t => t.id === testRunId);
      if (routeRunIndex >= 0) {
        setSelectedRunIndex(routeRunIndex);
      }
    }
  }, [testRunId, testRuns]);

  if (loading || !testRuns) {
    return (
      <div className="flex justify-center p-4">
        <Spinner className="w-4 animate-spin" />
      </div>
    );
  }

  const selectedRunId = testRuns[selectedRunIndex].id;

  return (
    <TestRunsContext.Provider value={{ selectedRunIndex, setSelectedRunIndex, selectedRunId }}>
      <div className="flex h-full space-x-2 overflow-y-auto">
        <div className="flex flex-col flex-grow w-full space-y-5">
          <div className="flex-grow overflow-y-auto no-scrollbar">
            <TestRunList testRuns={testRuns} />
          </div>
        </div>
        <TestRunOverview />
      </div>
    </TestRunsContext.Provider>
  );
}
