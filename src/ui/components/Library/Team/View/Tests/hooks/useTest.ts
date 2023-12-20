import { useQuery } from "@apollo/client";
import groupBy from "lodash/groupBy";
import { useContext, useMemo } from "react";

import { GetWorkspaceTestExecutions_node_Workspace } from "shared/graphql/generated/GetWorkspaceTestExecutions";
import { GroupedTestRun } from "shared/test-suites/TestRun";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { convertRecording } from "ui/hooks/recordings";

import { TimeFilterContext } from "../../TimeFilterContextRoot";
import { GET_WORKSPACE_TEST_EXECUTIONS } from "../graphql/TestGraphQL";

export function useTest(testId: string) {
  const { teamId } = useContext(TeamContext);
  const { startTime, endTime } = useContext(TimeFilterContext);
  const { data, loading, error } = useQuery<{ node: GetWorkspaceTestExecutions_node_Workspace }>(
    GET_WORKSPACE_TEST_EXECUTIONS,
    {
      variables: { workspaceId: teamId, testId, startTime, endTime },
    }
  );

  const test = useMemo(() => {
    const test = data?.node?.tests?.edges?.[0].node;

    if (!test) {
      return null;
    }

    const executions = test.executions.map(e => ({
      ...e,
      recordings: e.recordings.map(convertRecording),
    }));

    const groupedExecutions = groupBy(executions, "testRunId");
    const testRuns = Object.entries(groupedExecutions).reduce((acc, [testRunId, executions]) => {
      acc.push({
        testRunId,
        executions,
        date: executions[0].createdAt,
      });

      return acc;
    }, [] as GroupedTestRun[]);

    return {
      ...test,
      executions,
      testRuns,
    };
  }, [data]);

  return { test, loading, error };
}
