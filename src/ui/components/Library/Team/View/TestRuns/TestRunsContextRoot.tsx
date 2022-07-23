import { createContext, ReactNode, useContext, useEffect } from "react";
import { TestRun, useGetTestRunsForWorkspace } from "ui/hooks/tests";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { TeamContext } from "../../TeamContextRoot";
import { useRouter } from "next/router";

type TestRunsContextType = {
  focusId: string;
  testRuns: TestRun[] | null;
};

export const TestRunsContext = createContext<TestRunsContextType>(null as any);

export function TestRunsContainer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { focusId } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const { testRuns } = useGetTestRunsForWorkspace(teamId);

  // Initialize the focused test run to the first/most recent test run in the list
  useEffect(() => {
    if (testRuns?.length && !focusId) {
      router.push(`/team/${teamId}/runs/${testRuns[0]?.id}`);
    }
  }, [router, testRuns, focusId, teamId]);

  return (
    <TestRunsContext.Provider value={{ focusId, testRuns }}>{children}</TestRunsContext.Provider>
  );
}
