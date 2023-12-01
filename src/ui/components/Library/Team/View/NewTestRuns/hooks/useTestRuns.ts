import { useContext } from "react";
import { useImperativeIntervalCacheValues } from "suspense";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TestRun } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { testRunsIntervalCache } from "ui/components/Library/Team/View/NewTestRuns/suspense/TestRunsCache";
import useToken from "ui/utils/useToken";

import { TestRunsFilterContext } from "../../NewTestRuns/TestRunsContextRoot";

const EMPTY_ARRAY: any[] = [];

export function useTestRuns(): TestRun[] {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);
  const { startTime, endTime } = useContext(TestRunsFilterContext);

  const accessToken = useToken();

  const { value = EMPTY_ARRAY } = useImperativeIntervalCacheValues(
    testRunsIntervalCache,
    -endTime.getTime(),
    -startTime.getTime(),
    graphQLClient,
    accessToken?.token ?? null,
    teamId
  );
  return value;
}
