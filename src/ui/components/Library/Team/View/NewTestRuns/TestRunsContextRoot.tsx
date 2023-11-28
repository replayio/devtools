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
import { useSyncTestRunIdToUrl } from "ui/components/Library/Team/View/TestRuns/hooks/useSyncTestIdToUrl";
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
  testRuns: TestRun[];
  testRunId: string | null;
  testRunIdForDisplay: string | null;
  spec: string | null;
  setSpec: React.Dispatch<React.SetStateAction<string | null>>;
};

type TestRunsFilterContextType = {
  filterByTime: "week" | "month";
  startTime: string;
  endTime: string;
  setFilterByTime: Dispatch<SetStateAction<"week" | "month">>;
};

export const TestRunsFilterContext = createContext<TestRunsFilterContextType>(null as any);
export const TestRunsContext = createContext<TestRunsContextType>(null as any);

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  // Set zero hours, so when used in Cache as key, it will be the same for the whole day.
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

export function TestRunsFilterContextRoot({ children }: { children: ReactNode }) {
  const [filterByTime, setFilterByTime] = useState<"week" | "month">("week");

  const startTime = useMemo(() => {
    if (filterByTime === "week") {
      return daysAgo(7);
    }
    if (filterByTime === "month") {
      return daysAgo(30);
    }
    return daysAgo(7);
  }, [filterByTime]);

  const endTime = useMemo(() => {
    return new Date().toISOString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterByTime]);

  return (
    <TestRunsFilterContext.Provider value={{ filterByTime, startTime, endTime, setFilterByTime }}>
      {children}
    </TestRunsFilterContext.Provider>
  );
}

export function TestRunsContextRoot({ children }: { children: ReactNode }) {
  const { teamId, testRunId: defaultTestRunId } = useGetTeamRouteParams();

  const testRuns = useTestRuns();

  const [testRunId, setTestRunId] = useState<string | null>(defaultTestRunId);

  const [filterByBranch, setFilterByBranch] = useState<"all" | "primary">("all");
  const [filterByStatus, setFilterByStatus] = useState<"all" | "failed">("all");

  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);

  const [spec, setSpec] = useState<string | null>(null);

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

  useSyncTestRunIdToUrl(teamId, testRunId, setTestRunId);

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
        spec,
        setSpec,
      }}
    >
      {children}
    </TestRunsContext.Provider>
  );
}
