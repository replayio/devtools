import { useRouter } from "next/router";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import { TestRun, getTestRunTitle } from "shared/test-suites/TestRun";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { useSyncTestStateToUrl } from "ui/components/Library/Team/View/TestRuns/hooks/useSyncTestStateToUrl";
import { useTestRuns } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRuns";

type TestRunsContextType = {
  filterByBranch: "all" | "primary";
  filterByStatus: "all" | "failed";
  filterByText: string;
  filterByTextForDisplay: string;
  selectTestRun: Dispatch<SetStateAction<string | null>>;
  setFilterByBranch: Dispatch<SetStateAction<"all" | "primary">>;
  setFilterByStatus: Dispatch<SetStateAction<"all" | "failed">>;
  setFilterByText: Dispatch<SetStateAction<string>>;
  testRunId: string | null;
  testRunIdForDisplay: string | null;
  testRuns: TestRun[];
};

export const TestRunsContext = createContext<TestRunsContextType>(null as any);

type FilterByBranch = "all" | "primary";
type FilterByStatus = "all" | "failed";

export function TestRunsContextRoot({ children }: { children: ReactNode }) {
  const { teamId, testRunId: defaultTestRunId } = useGetTeamRouteParams();

  const testRuns = useTestRuns();

  const [testRunId, setTestRunId] = useState<string | null>(defaultTestRunId);

  const [filterByBranch, setFilterByBranch] = useState<FilterByBranch>(() => {
    const query = new URLSearchParams(window.location.search);
    return (query.get("filterByBranch") as FilterByBranch) ?? "all";
  });
  const [filterByStatus, setFilterByStatus] = useState<FilterByStatus>(() => {
    const query = new URLSearchParams(window.location.search);
    return (query.get("filterByStatus") as FilterByStatus) ?? "all";
  });

  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);

  const router = useRouter();

  const filteredTestRuns = useMemo(() => {
    let filteredTestRuns = testRuns;

    if (filterByBranch === "primary" || filterByStatus === "failed" || filterByText !== "") {
      const lowerCaseText = filterByText.toLowerCase();

      filteredTestRuns = filteredTestRuns.filter(testRun => {
        if (filterByStatus === "failed") {
          if (testRun.results.counts.failed === 0) {
            return false;
          }
        }

        const branchName = testRun.source?.branchName ?? "";

        if (filterByBranch === "primary") {
          // TODO This should be configurable by Workspace
          if (branchName !== "main" && branchName !== "master") {
            return false;
          }
        }

        if (filterByText !== "") {
          const user = testRun.source?.user ?? "";
          const title = getTestRunTitle(testRun);

          if (
            !branchName.toLowerCase().includes(lowerCaseText) &&
            !user.toLowerCase().includes(lowerCaseText) &&
            !title.toLowerCase().includes(lowerCaseText)
          ) {
            return false;
          }
        }

        return true;
      });
    }

    return filteredTestRuns;
  }, [filterByBranch, filterByStatus, filterByText, testRuns]);

  useEffect(() => {
    if (testRunId == null) {
      // Select the first test run by default if nothing is selected.
      setTestRunId(testRuns[0]?.id ?? null);
    }
  }, [router, teamId, testRunId, testRuns]);

  useSyncTestStateToUrl(teamId, testRunId, setTestRunId);

  const deferredTestRunId = useDeferredValue(testRunId);

  return (
    <TestRunsContext.Provider
      value={{
        filterByBranch,
        filterByStatus,
        filterByText: filterByTextDeferred,
        filterByTextForDisplay: filterByText,
        selectTestRun: setTestRunId,
        setFilterByBranch,
        setFilterByStatus,
        setFilterByText,
        testRunId: deferredTestRunId,
        testRunIdForDisplay: testRunId,
        testRuns: filteredTestRuns,
      }}
    >
      {children}
    </TestRunsContext.Provider>
  );
}
