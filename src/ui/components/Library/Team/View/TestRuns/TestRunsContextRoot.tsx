import { useRouter } from "next/router";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useDeferredValue,
  useLayoutEffect,
  useState,
  useTransition,
} from "react";

import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { trackEvent } from "ui/utils/telemetry";

export type FilterByBranch = "all" | "primary";
export type FilterByStatus = "all" | "failed";

type TestRunsContextType = {
  filterByBranch: FilterByBranch;
  filterByStatus: FilterByStatus;
  filterByText: string;
  filterByTextForDisplay: string;
  filterTestsByText: string;
  selectTestRun: Dispatch<SetStateAction<string | null>>;
  setFilterByBranch: Dispatch<SetStateAction<FilterByBranch>>;
  setFilterByStatus: Dispatch<SetStateAction<FilterByStatus>>;
  setFilterByText: Dispatch<SetStateAction<string>>;
  setFilterTestsByText: Dispatch<SetStateAction<string>>;
  testRunIdForSuspense: string | null;
  testRunId: string | null;
  testRunPending: boolean;
  testId: string | null;
  setTestId: React.Dispatch<React.SetStateAction<string | null>>;
};

export const TestRunsContext = createContext<TestRunsContextType>(null as any);

export function TestRunsContextRoot({ children }: { children: ReactNode }) {
  const { teamId, testRunId, testId } = useGetTeamRouteParams();
  const [testRunIdForSuspense, setTestRunIdForSuspense] = useState<string | null>(
    testRunId ?? null
  );
  const [filterByBranch, setFilterByBranch] = useState<FilterByBranch>("all");
  const [filterByStatus, setFilterByStatus] = useState<FilterByStatus>("all");

  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);
  const [filterTestsByText, setFilterTestsByText] = useState("");
  const router = useRouter();

  const [isTestRunPending, startTestRunTransition] = useTransition();
  useLayoutEffect(() => {
    if (testRunId) {
      setFilterTestsByText("");
      startTestRunTransition(() => {
        setTestRunIdForSuspense(testRunId);
      });
    }
  }, [testRunId]);

  return (
    <TestRunsContext.Provider
      value={{
        filterByBranch,
        filterByStatus,
        filterByText: filterByTextDeferred,
        filterByTextForDisplay: filterByText,
        filterTestsByText,
        selectTestRun: runId => {
          trackEvent("test_dashboard.select_run", { view: "runs" });
          router.push({ pathname: `/team/${teamId}/runs/${runId}`, query: router.query });
        },
        setFilterByBranch,
        setFilterByStatus,
        setFilterByText,
        setFilterTestsByText,
        testRunIdForSuspense: testRunIdForSuspense,
        testRunId: testRunId ?? null,
        testRunPending: isTestRunPending,
        testId: testId ?? null,
        setTestId: testId => {
          trackEvent("test_dashboard.select_test", { view: "runs" });
          router.push({
            pathname: `/team/${teamId}/runs/${testRunId}/tests/${testId}`,
            query: router.query,
          });
        },
      }}
    >
      {children}
    </TestRunsContext.Provider>
  );
}
