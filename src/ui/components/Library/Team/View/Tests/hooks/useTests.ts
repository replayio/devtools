import { useContext } from "react";
import { Status, useImperativeCacheValue } from "suspense";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { Test } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import useToken from "ui/utils/useToken";

import { TimeFilterContext } from "../../TimeFilterContextRoot";
import { testsCache } from "../suspense/TestsCache";

const EMPTY_ARRAY: any[] = [];

export function useTests(): { tests: Test[]; status: Status } {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);
  const { startTime, endTime } = useContext(TimeFilterContext);

  const accessToken = useToken();

  const { value = EMPTY_ARRAY, status } = useImperativeCacheValue(
    testsCache,
    graphQLClient,
    accessToken?.token ?? null,
    teamId,
    startTime,
    endTime
  );
  return { tests: value, status };
}
