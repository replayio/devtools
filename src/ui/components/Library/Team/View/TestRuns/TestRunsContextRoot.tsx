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
  const [filterByBranch, setFilterByBranch] = useState<"all" | "primary">("all");
  const [filterByStatus, setFilterByStatus] = useState<"all" | "failed">("all");

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
          router.push(`/team/${teamId}/runs/${runId}`);
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
          router.push(`/team/${teamId}/runs/${testRunId}/tests/${testId}`);
        },
      }}
    >
      {children}
    </TestRunsContext.Provider>
  );
}
