import { createContext, ReactNode, useContext } from "react";
import { TestRun, useGetTestRunForWorkspace } from "ui/hooks/tests";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { TeamContext } from "../../../TeamContextRoot";
import { TestRunsContext } from "../TestRunsContextRoot";

type TestRunOverviewContainerContextType = {
  view: string;
  testRun: TestRun | null;
};

export const TestRunOverviewContext = createContext<TestRunOverviewContainerContextType>(
  null as any
);

export function TestRunOverviewContainer({ children }: { children: ReactNode; }) {
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
