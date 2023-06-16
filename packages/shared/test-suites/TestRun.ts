import { GetTestsRun_node_Workspace_testRuns_edges_node } from "shared/graphql/generated/GetTestsRun";
import { GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node } from "shared/graphql/generated/GetTestsRunsForWorkspace";
import { Recording } from "shared/graphql/types";
import { convertRecording } from "ui/hooks/recordings";

export type Mode = "diagnostics" | "record-on-retry" | "stress";

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

export function convertSummary(
  summary:
    | GetTestsRun_node_Workspace_testRuns_edges_node
    | GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node
): Summary {
  return {
    ...summary,
    mode: summary.mode as Mode | null,
    results: {
      ...summary.results,
      recordings:
        "recordings" in summary.results
          ? summary.results.recordings.map(rec => convertRecording(rec)!)
          : [],
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
