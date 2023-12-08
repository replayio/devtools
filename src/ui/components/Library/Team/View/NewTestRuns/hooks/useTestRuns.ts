import { useContext, useMemo } from "react";
import { Status, useImperativeIntervalCacheValues } from "suspense";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TestRun } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { testRunsIntervalCache } from "ui/components/Library/Team/View/NewTestRuns/suspense/TestRunsCache";
import useToken from "ui/utils/useToken";

import { TimeFilterContext } from "../../TimeFilterContextRoot";

const EMPTY_ARRAY: any[] = [];

export function useTestRuns(): { testRuns: TestRun[]; status: Status } {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);
  const { startTime, endTime } = useContext(TimeFilterContext);

  const accessToken = useToken();

  const { value = EMPTY_ARRAY, status } = useImperativeIntervalCacheValues(
    testRunsIntervalCache,
    startTime.getTime(),
    endTime.getTime(),
    graphQLClient,
    accessToken?.token ?? null,
    teamId
  );

  const testRuns = useMemo(() => [...value].reverse(), [value]);

  return { testRuns, status };
}
