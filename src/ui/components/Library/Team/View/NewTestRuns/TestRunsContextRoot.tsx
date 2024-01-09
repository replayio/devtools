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
import { STATUS_PENDING } from "suspense";

import { TestRun, getTestRunTitle } from "shared/test-suites/TestRun";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { useTestRuns } from "ui/components/Library/Team/View/NewTestRuns/hooks/useTestRuns";
import { useSyncTestRunIdToUrl } from "ui/components/Library/Team/View/TestRuns/hooks/useSyncTestIdToUrl";
import { trackEvent } from "ui/utils/telemetry";

type TestRunsContextType = {
  filterByBranch: "all" | "primary";
  filterByStatus: "all" | "failed";
  filterByText: string;
  filterByTextForDisplay: string;
  filterTestsByText: string;
  selectTestRun: Dispatch<SetStateAction<string | null>>;
  setFilterByBranch: Dispatch<SetStateAction<"all" | "primary">>;
  setFilterByStatus: Dispatch<SetStateAction<"all" | "failed">>;
  setFilterByText: Dispatch<SetStateAction<string>>;
  setFilterTestsByText: Dispatch<SetStateAction<string>>;
  testRunsLoading: boolean;
  testRuns: TestRun[];
  testRunCount: number;
  testRunId: string | null;
  testRunIdForDisplay: string | null;
  testId: string | null;
  setTestId: React.Dispatch<React.SetStateAction<string | null>>;
};

export const TestRunsContext = createContext<TestRunsContextType>(null as any);

export function TestRunsContextRoot({ children }: { children: ReactNode }) {
  const { teamId, testRunId: defaultTestRunId } = useGetTeamRouteParams();

  const { testRuns, status } = useTestRuns();

  const [testRunId, setTestRunId] = useState<string | null>(defaultTestRunId);

  const [filterByBranch, setFilterByBranch] = useState<"all" | "primary">("all");
  const [filterByStatus, setFilterByStatus] = useState<"all" | "failed">("all");

  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);
  const [filterTestsByText, setFilterTestsByText] = useState("");

  const [testId, setTestId] = useState<string | null>(null);

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

  useEffect(() => {
    setFilterTestsByText("");
  }, [testRunId]);

  useSyncTestRunIdToUrl(teamId, testRunId, setTestRunId);

  const deferredTestRunId = useDeferredValue(testRunId);

  return (
    <TestRunsContext.Provider
      value={{
        filterByBranch,
        filterByStatus,
        filterByText: filterByTextDeferred,
        filterByTextForDisplay: filterByText,
        filterTestsByText,
        selectTestRun: runId => {
          setTestRunId(runId);
          trackEvent("test_dashboard.select_run", { view: "runs" });
        },
        setFilterByBranch,
        setFilterByStatus,
        setFilterByText,
        setFilterTestsByText,
        testRunId: deferredTestRunId,
        testRunIdForDisplay: testRunId,
        testRunsLoading: status === STATUS_PENDING,
        testRuns: filteredTestRuns,
        testRunCount: status === STATUS_PENDING ? 0 : testRuns.length,
        testId,
        setTestId: testId => {
          setTestId(testId);
          trackEvent("test_dashboard.select_test", { view: "runs" });
        },
      }}
    >
      {children}
    </TestRunsContext.Provider>
  );
}
