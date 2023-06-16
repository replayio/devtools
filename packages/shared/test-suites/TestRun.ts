import { GetTestsRun_node_Workspace_testRuns_edges_node as TestRunGraphQL } from "shared/graphql/generated/GetTestsRun";
import { GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node as TestRunsForWorkspaceGraphQL } from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { Recording } from "shared/graphql/types";
import { convertRecording } from "ui/hooks/recordings";

export type Mode = "diagnostics" | "record" | "record-on-retry" | "stress";

export type SourceMetadata = {
  branchName: string | null;
  commitId: string;
  commitTitle: string | null;
  groupLabel: string | null;
  isPrimaryBranch: boolean;
  prNumber: number | null;
  prTitle: string | null;
  repository: string | null;
  triggerUrl: string | null;
  user: string | null;
};

export interface Summary {
  date: string;
  id: string;
  mode: Mode | null;
  results: {
    counts: {
      failed: number;
      flaky: number;
      passed: number;
    };
    recordings: Recording[];
  };
  source: SourceMetadata | null;
}

export function processSummary(summary: TestRunGraphQL | TestRunsForWorkspaceGraphQL): Summary {
  const { mode, results, ...rest } = summary;

  let recordings: Recording[] = [];
  if ("recordings" in results) {
    recordings = results.recordings.map(convertRecording);
  }

  return {
    ...rest,
    mode: mode as Mode | null,
    results: {
      ...results,
      recordings,
    },
  };
}

export function getTestRunTitle(groupedTestCases: Summary): string {
  const { source } = groupedTestCases;
  if (source) {
    const { commitTitle, prTitle } = source;
    if (commitTitle) {
      return commitTitle;
    } else if (prTitle) {
      return prTitle;
    }
  }

  return "Test";
}
