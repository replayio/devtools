import { useRouter } from "next/router";
import { ReactNode, createContext, useContext, useEffect } from "react";

import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { TestSuiteRun, useGetTestRunsForWorkspace } from "ui/hooks/tests";

import { TeamContext } from "../../TeamContextRoot";

type TestRunsContextType = {
  focusId: string;
  loading: boolean;
  testSuiteRuns: TestSuiteRun[];
};

export const TestRunsContext = createContext<TestRunsContextType>(null as any);

export function TestRunsContainer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { focusId } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const { loading, testSuiteRuns } = useGetTestRunsForWorkspace(teamId);

  // Initialize the focused test run to the first/most recent test run in the list
  useEffect(() => {
    if (testSuiteRuns?.length && !focusId) {
      router.push(`/team/${teamId}/runs/${testSuiteRuns[0]?.id}`);
    }
  }, [router, testSuiteRuns, focusId, teamId]);

  return (
    <TestRunsContext.Provider value={{ focusId, loading, testSuiteRuns }}>
      {children}
    </TestRunsContext.Provider>
  );
}
