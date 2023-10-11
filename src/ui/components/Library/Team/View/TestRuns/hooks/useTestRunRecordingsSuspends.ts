import { useContext } from "react";

import { assert } from "protocol/utils";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { testRunRecordingsCache } from "ui/components/Library/Team/View/TestRuns/suspense/TestRunsCache";
import useToken from "ui/utils/useToken";

import { TestRunsContext } from "../TestRunsContextRoot";

export function useTestRunRecordingsSuspends(testRunId: string | null) {
  const { testRuns } = useContext(TestRunsContext);
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);

  const accessToken = useToken();

  if (testRunId) {
    const testRun = testRuns.find(t => t.id === testRunId);
    assert(testRun != null);

    return testRunRecordingsCache.read(graphQLClient, accessToken?.token ?? null, teamId, testRun);
  }

  return {
    groupedRecordings: null,
    recordings: null,
  };
}
