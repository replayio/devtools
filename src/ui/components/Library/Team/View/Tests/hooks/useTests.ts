import { useContext } from "react";
import { Status, useImperativeCacheValue } from "suspense";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { Test } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import useToken from "ui/utils/useToken";

import { testsCache } from "../../TestRuns/suspense/TestsCache";

const EMPTY_ARRAY: any[] = [];

export function useTests(): { tests: Test[]; status: Status } {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);

  const accessToken = useToken();

  const { value = EMPTY_ARRAY, status } = useImperativeCacheValue(
    testsCache,
    graphQLClient,
    accessToken?.token ?? null,
    teamId
  );
  return { tests: value, status };
}
