import { useRouter } from "next/router";
import { ReactNode, createContext, useContext, useEffect } from "react";

import { Summary } from "shared/test-suites/TestRun";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { useGetTestRunsForWorkspace } from "ui/hooks/tests";

import { TeamContext } from "../../TeamContextRoot";

type TestRunsContextType = {
  focusId: string;
  loading: boolean;
  summaries: Summary[];
};

export const TestRunsContext = createContext<TestRunsContextType>(null as any);

export function TestRunsContainer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { focusId } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const { loading, summaries } = useGetTestRunsForWorkspace(teamId);

  // Initialize the focused test run to the first/most recent test run in the list
  useEffect(() => {
    if (summaries.length > 0 && !focusId) {
      router.push(`/team/${teamId}/runs/${summaries[0].id}`);
    }
  }, [router, focusId, summaries, teamId]);

  return (
    <TestRunsContext.Provider value={{ focusId, loading, summaries }}>
      {children}
    </TestRunsContext.Provider>
  );
}
