import { useRouter } from "next/router";
import { ReactNode, createContext, useContext, useEffect } from "react";

import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { TestRun, useGetTestRunsForWorkspace } from "ui/hooks/tests";

import { TeamContext } from "../../TeamContextRoot";

type TestRunsContextType = {
  focusId: string;
  loading: boolean;
  testRuns: TestRun[];
};

export const TestRunsContext = createContext<TestRunsContextType>(null as any);

export function TestRunsContainer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { focusId } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const { loading, testRuns } = useGetTestRunsForWorkspace(teamId);

  // Initialize the focused test run to the first/most recent test run in the list
  useEffect(() => {
    if (testRuns?.length && !focusId) {
      router.push(`/team/${teamId}/runs/${testRuns[0]?.id}`);
    }
  }, [router, testRuns, focusId, teamId]);

  return (
    <TestRunsContext.Provider value={{ focusId, loading, testRuns }}>
      {children}
    </TestRunsContext.Provider>
  );
}
