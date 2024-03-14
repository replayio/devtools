import { useContext } from "react";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import useToken from "ui/utils/useToken";

import { testRunDetailsCache } from "../suspense/TestRunsCache";

export function useTestRunDetailsSuspends(testRunId: string | null) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);

  const accessToken = useToken();

  return testRunId
    ? testRunDetailsCache.read(graphQLClient, accessToken?.token ?? null, teamId, testRunId)
    : {
        testRun: null,
        groupedTests: null,
        recordings: null,
        tests: null,
        durationMs: 0,
      };
}
