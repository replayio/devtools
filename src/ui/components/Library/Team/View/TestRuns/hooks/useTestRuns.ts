import { useContext, useEffect, useMemo, useState } from "react";
import { STATUS_PENDING, Status, useImperativeIntervalCacheValues } from "suspense";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TestRun } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import useToken from "ui/utils/useToken";

import { TimeFilterContext } from "../../TimeFilterContextRoot";
import { testRunsIntervalCache } from "../suspense/TestRunsCache";

const EMPTY_ARRAY: any[] = [];

export function useTestRuns(): { testRuns: TestRun[]; status: Status } {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);
  const { startTime, endTime } = useContext(TimeFilterContext);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);

  const accessToken = useToken();

  const { value = EMPTY_ARRAY, status } = useImperativeIntervalCacheValues(
    testRunsIntervalCache,
    startTime.getTime(),
    endTime.getTime(),
    graphQLClient,
    accessToken?.token ?? null,
    teamId
  );

  useEffect(() => {
    if (status === STATUS_PENDING) {
      // To avoid resetting the test runs to an empty array when loading
      return;
    }

    setTestRuns(value);
  }, [value, status]);

  const testRunsDesc = useMemo(() => [...testRuns].reverse(), [testRuns]);

  return { testRuns: testRunsDesc, status };
}
