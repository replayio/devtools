import { useContext } from "react";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { testRunDetailsCache } from "ui/components/Library/Team/View/NewTestRuns/suspense/TestRunsCache";
import useToken from "ui/utils/useToken";

export function useTestRunDetailsSuspends(testRunId: string | null) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);

  const accessToken = useToken();

  return testRunId
    ? testRunDetailsCache.read(graphQLClient, accessToken?.token ?? null, teamId, testRunId)
    : {
        groupedTests: null,
        tests: null,
        recordings: null,
        durationMs: 0,
      };
}
