import { useContext, useEffect, useMemo, useState } from "react";
import { STATUS_PENDING, Status, useImperativeIntervalCacheValues } from "suspense";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TestRun } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import useToken from "ui/utils/useToken";

import { TimeFilterContext } from "../../TimeFilterContextRoot";
import { testRunsIntervalCache } from "../suspense/TestRunsCache";

const EMPTY_ARRAY: any[] = [];

export function useTestRunSuspends(): { testRuns: TestRun[] } {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);
  const { startTime, endTime } = useContext(TimeFilterContext);

  const accessToken = useToken();

  const testRuns = teamId
    ? testRunsIntervalCache.read(
        startTime.getTime(),
        endTime.getTime(),
        graphQLClient,
        accessToken?.token ?? null,
        teamId
      )
    : EMPTY_ARRAY;

  const testRunsDesc = useMemo(() => [...testRuns].reverse(), [testRuns]);

  return { testRuns: testRunsDesc };
}
