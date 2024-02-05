import { useContext, useMemo } from "react";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { TestRun, filterTestRun } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { TestRunsContext } from "ui/components/Library/Team/View/TestRuns/TestRunsContextRoot";
import useToken from "ui/utils/useToken";

import { TimeFilterContext } from "../../TimeFilterContextRoot";
import { testRunsIntervalCache } from "../suspense/TestRunsCache";

const EMPTY_ARRAY: any[] = [];

export function useTestRunsSuspends(): { testRuns: TestRun[] } {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);
  const { filterByText, filterByBranch, filterByStatus } = useContext(TestRunsContext);
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

  const filteredSortedTestRuns = useMemo(() => {
    let filteredTestRuns = testRuns;

    if (filterByBranch === "primary" || filterByStatus === "failed" || filterByText !== "") {
      filteredTestRuns = filteredTestRuns.filter(testRun =>
        filterTestRun(testRun, {
          branch: filterByBranch,
          text: filterByText,
          status: filterByStatus,
        })
      );
    }

    return [...filteredTestRuns].reverse();
  }, [filterByBranch, filterByStatus, filterByText, testRuns]);

  return { testRuns: filteredSortedTestRuns };
}
