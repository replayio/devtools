import { ReactNode, createContext, useContext } from "react";

import { TestSuite } from "shared/test-suites/types";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { useGetTestRunForWorkspace } from "ui/hooks/tests";

import { TeamContext } from "../../../TeamContextRoot";
import { TestRunsContext } from "../TestRunsContextRoot";

type TestRunOverviewContainerContextType = {
  view: string;
  testSuite: TestSuite | null;
};

export const TestRunOverviewContext = createContext<TestRunOverviewContainerContextType>(
  null as any
);

export function TestRunOverviewContainer({ children }: { children: ReactNode }) {
  const { view } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const { focusId } = useContext(TestRunsContext);
  const { testSuite } = useGetTestRunForWorkspace(teamId, focusId);

  return (
    <TestRunOverviewContext.Provider value={{ view, testSuite }}>
      {children}
    </TestRunOverviewContext.Provider>
  );
}
