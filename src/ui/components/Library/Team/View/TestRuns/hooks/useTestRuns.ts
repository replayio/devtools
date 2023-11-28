import { useContext } from "react";
import { useImperativeCacheValue } from "suspense";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TestRun } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { testRunsCache } from "ui/components/Library/Team/View/TestRuns/suspense/TestRunsCache";
import useToken from "ui/utils/useToken";

import { TestRunsFilterContext } from "../../NewTestRuns/TestRunsContextRoot";

const EMPTY_ARRAY: any[] = [];

export function useTestRuns(): TestRun[] {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);
  const testRunFilterContext = useContext(TestRunsFilterContext);

  const accessToken = useToken();

  const { value = EMPTY_ARRAY } = useImperativeCacheValue(
    testRunsCache,
    graphQLClient,
    accessToken?.token ?? null,
    teamId,
    testRunFilterContext?.startTime,
    testRunFilterContext?.endTime
  );
  return value;
}
