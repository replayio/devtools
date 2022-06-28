import { createContext, ReactNode, useContext } from "react";
import { TestRun, useGetTestRunForWorkspace } from "ui/hooks/tests";
import { useGetTeamRouteParams } from "ui/utils/library";
import { TeamContext } from "../../../TeamContext";
import { TestRunsContext } from "../TestRunsPage";
import { TestRunOverviewContent } from "./TestRunOverviewContent";

type TestRunOverviewContainerContextType = {
  view: string;
  testRun: TestRun | null;
};

export const TestRunOverviewContext = createContext<TestRunOverviewContainerContextType>(
  null as any
);

export function TestRunOverviewContainer({ children }: { children: ReactNode }) {
  const { view } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const { focusId } = useContext(TestRunsContext);
  const { testRun } = useGetTestRunForWorkspace(teamId, focusId);

  return (
    <TestRunOverviewContext.Provider value={{ view, testRun }}>
      {children}
    </TestRunOverviewContext.Provider>
  );
}

export function TestRunOverviewPage() {
  return (
    <TestRunOverviewContainer>
      <TestRunOverviewContent />
    </TestRunOverviewContainer>
  );
}
