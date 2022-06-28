import { createContext, ReactNode, useContext, useEffect } from "react";
import { TestRun, useGetTestRunsForWorkspace } from "ui/hooks/tests";
import { useGetTeamRouteParams } from "ui/utils/library";
import { TeamContext } from "../../TeamContext";
import { TestRunOverviewPage } from "./Overview/TestRunOverviewPage";
import { TestRunList } from "./TestRunList";

type TestRunsContextType = {
  focusId: string;
  testRuns: TestRun[] | null;
};

export const TestRunsContext = createContext<TestRunsContextType>(null as any);

export function TestRunsContainer({ children }: { children: ReactNode }) {
  const { focusId } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const { testRuns } = useGetTestRunsForWorkspace(teamId);

  return (
    <TestRunsContext.Provider value={{ focusId, testRuns }}>{children}</TestRunsContext.Provider>
  );
}

export function TestRunsPage() {
  return (
    <TestRunsContainer>
      <TestRunsContent />
    </TestRunsContainer>
  );
}

function TestRunsContent() {
  const { focusId } = useContext(TestRunsContext);

  return (
    <div className="flex flex-row flex-grow">
      <TestRunList />
      {focusId ? <TestRunOverviewPage /> : null}
    </div>
  );
}
