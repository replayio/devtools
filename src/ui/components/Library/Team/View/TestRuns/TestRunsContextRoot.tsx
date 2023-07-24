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
  filterByStatus: "all" | "failed";
  filterByText: string;
  filterByTextForDisplay: string;
  selectTestRun: Dispatch<SetStateAction<string | null>>;
  setFilterByStatus: Dispatch<SetStateAction<"all" | "failed">>;
  setFilterByText: Dispatch<SetStateAction<string>>;
  testRunId: string | null;
  testRunIdForDisplay: string | null;
  testRuns: TestRun[];
};

export const TestRunsContext = createContext<TestRunsContextType>(null as any);

export function TestRunsContextRoot({ children }: { children: ReactNode }) {
  const { teamId, testRunId: defaultTestRunId } = useGetTeamRouteParams();

  const testRuns = useTestRuns();

  const [testRunId, setTestRunId] = useState<string | null>(defaultTestRunId);

  const [filterByStatus, setFilterByStatus] = useState<"all" | "failed">("all");

  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);

  const router = useRouter();

  const filteredTestRuns = useMemo(() => {
    let filteredTestRuns = testRuns;

    if (filterByStatus === "failed") {
      filteredTestRuns = filteredTestRuns.filter(testRun => testRun.results.counts.failed > 0);
    }

    if (filterByText !== "") {
      const lowerCaseText = filterByText.toLowerCase();

      filteredTestRuns = filteredTestRuns.filter(testRun => {
        const branchName = testRun.source?.branchName ?? "";
        const user = testRun.source?.user ?? "";

        const title = getTestRunTitle(testRun);

        return (
          branchName.toLowerCase().includes(lowerCaseText) ||
          user.toLowerCase().includes(lowerCaseText) ||
          title.toLowerCase().includes(lowerCaseText)
        );
      });
    }

    return filteredTestRuns;
  }, [filterByStatus, filterByText, testRuns]);

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
        filterByStatus,
        filterByText: filterByTextDeferred,
        filterByTextForDisplay: filterByText,
        testRunId: deferredTestRunId,
        testRunIdForDisplay: testRunId,
        selectTestRun: setTestRunId,
        setFilterByStatus,
        setFilterByText,
        testRuns: filteredTestRuns,
      }}
    >
      {children}
    </TestRunsContext.Provider>
  );
}
