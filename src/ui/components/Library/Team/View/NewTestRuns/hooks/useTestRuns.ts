import { useContext, useMemo } from "react";
import { useImperativeIntervalCacheValues } from "suspense";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TestRun } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { testRunsIntervalCache } from "ui/components/Library/Team/View/NewTestRuns/suspense/TestRunsCache";
import useToken from "ui/utils/useToken";

import { TestRunsFilterContext } from "../../NewTestRuns/TestRunsContextRoot";

const EMPTY_ARRAY: any[] = [];

export function useTestRuns(branch: string | null): TestRun[] {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);
  const { startTime, endTime } = useContext(TestRunsFilterContext);

  const accessToken = useToken();

  const { value = EMPTY_ARRAY } = useImperativeIntervalCacheValues(
    testRunsIntervalCache,
    startTime.getTime(),
    endTime.getTime(),
    graphQLClient,
    accessToken?.token ?? null,
    teamId,
    branch
  );

  const testRunsDesc = useMemo(() => [...value].reverse(), [value]);

  return testRunsDesc;
}
