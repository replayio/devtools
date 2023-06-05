import { ReactNode, createContext, useContext } from "react";

import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { TestSuiteRun, useGetTestRunForWorkspace } from "ui/hooks/tests";

import { TeamContext } from "../../../TeamContextRoot";
import { TestRunsContext } from "../TestRunsContextRoot";

type TestRunOverviewContainerContextType = {
  view: string;
  testSuiteRun: TestSuiteRun | null;
};

export const TestRunOverviewContext = createContext<TestRunOverviewContainerContextType>(
  null as any
);

export function TestRunOverviewContainer({ children }: { children: ReactNode }) {
  const { view } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const { focusId } = useContext(TestRunsContext);
  const { testSuiteRun } = useGetTestRunForWorkspace(teamId, focusId);

  return (
    <TestRunOverviewContext.Provider value={{ view, testSuiteRun }}>
      {children}
    </TestRunOverviewContext.Provider>
  );
}
