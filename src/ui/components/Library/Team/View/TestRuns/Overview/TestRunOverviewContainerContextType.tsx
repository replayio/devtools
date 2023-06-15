import { ReactNode, createContext, useContext } from "react";

import { Summary } from "shared/test-suites/TestRun";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { useGetTestRunForWorkspace } from "ui/hooks/tests";

import { TeamContext } from "../../../TeamContextRoot";
import { TestRunsContext } from "../TestRunsContextRoot";

type TestRunOverviewContainerContextType = {
  summary: Summary | null;
  view: string;
};

export const TestRunOverviewContext = createContext<TestRunOverviewContainerContextType>(
  null as any
);

export function TestRunOverviewContainer({ children }: { children: ReactNode }) {
  const { view } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const { focusId } = useContext(TestRunsContext);
  const { summary } = useGetTestRunForWorkspace(teamId, focusId);

  return (
    <TestRunOverviewContext.Provider value={{ summary, view }}>
      {children}
    </TestRunOverviewContext.Provider>
  );
}
