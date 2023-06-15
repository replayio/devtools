import { useRouter } from "next/router";
import { ReactNode, createContext, useContext, useEffect } from "react";

import { GroupedTestCases } from "shared/test-suites/TestRun";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { useGetTestRunsForWorkspace } from "ui/hooks/tests";

import { TeamContext } from "../../TeamContextRoot";

type TestRunsContextType = {
  focusId: string;
  groupedTestCases: GroupedTestCases[];
  loading: boolean;
};

export const TestRunsContext = createContext<TestRunsContextType>(null as any);

export function TestRunsContainer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { focusId } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const { groupedTestCases, loading } = useGetTestRunsForWorkspace(teamId);

  // Initialize the focused test run to the first/most recent test run in the list
  useEffect(() => {
    if (groupedTestCases.length > 0 && !focusId) {
      router.push(`/team/${teamId}/runs/${groupedTestCases[0].id}`);
    }
  }, [router, groupedTestCases, focusId, teamId]);

  return (
    <TestRunsContext.Provider value={{ focusId, loading, groupedTestCases }}>
      {children}
    </TestRunsContext.Provider>
  );
}
