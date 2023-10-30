import { useContext } from "react";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { testRunRecordingsCache } from "ui/components/Library/Team/View/TestRuns/suspense/TestRunsCache";
import useToken from "ui/utils/useToken";

export function useTestRunRecordingsSuspends(testRunId: string | null) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);

  const accessToken = useToken();

  return testRunId
    ? testRunRecordingsCache.read(graphQLClient, accessToken?.token ?? null, teamId, testRunId)
    : {
        groupedRecordings: null,
        recordings: null,
        durationMs: 0,
      };
}
