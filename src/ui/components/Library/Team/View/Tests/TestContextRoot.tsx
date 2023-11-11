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

import { TestRun, __TEST, getTestRunTitle } from "shared/test-suites/TestRun";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { useSyncTestRunIdToUrl } from "ui/components/Library/Team/View/TestRuns/hooks/useSyncTestIdToUrl";
import { useTestRuns } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRuns";

import { useTests } from "./hooks/useTests";

type TestsContextType = {
  // filterByBranch: "all" | "primary";
  // filterByStatus: "all" | "failed";
  filterByText: string;
  filterByTextForDisplay: string;
  selectTestId: Dispatch<SetStateAction<string | null>>;
  // setFilterByBranch: Dispatch<SetStateAction<"all" | "primary">>;
  // setFilterByStatus: Dispatch<SetStateAction<"all" | "failed">>;
  setFilterByText: Dispatch<SetStateAction<string>>;
  testId: string | null;
  testIdForDisplay: string | null;
  tests: __TEST[];
};

export const TestContext = createContext<TestsContextType>(null as any);

export function TestsContextRoot({ children }: { children: ReactNode }) {
  // const { teamId, testRunId: defaultTestRunId } = useGetTeamRouteParams();

  const tests = useTests();

  const [testId, setTestId] = useState<string | null>(null);

  // const [filterByBranch, setFilterByBranch] = useState<"all" | "primary">("all");
  // const [filterByStatus, setFilterByStatus] = useState<"all" | "failed">("all");

  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);

  const router = useRouter();

  const filteredTestRuns = useMemo(() => {
    let filteredTestRuns = tests;

    if (filterByText !== "") {
      const lowerCaseText = filterByText.toLowerCase();

      filteredTestRuns = filteredTestRuns.filter(testRun => {
        if (filterByText !== "") {
          const title = getTestRunTitle(testRun);

          if (!title.toLowerCase().includes(lowerCaseText)) {
            return false;
          }
        }

        return true;
      });
    }

    return filteredTestRuns;
  }, [filterByText, tests]);
  // }, [filterByBranch, filterByStatus, filterByText, testRuns]);

  // useEffect(() => {
  //   if (testRunId == null) {
  //     // Select the first test run by default if nothing is selected.
  //     setTestRunId(testRuns[0]?.id ?? null);
  //   }
  // }, [router, teamId, testRunId, testRuns]);

  // useSyncTestRunIdToUrl(teamId, testRunId, setTestRunId);

  const deferredTestId = useDeferredValue(testId);

  return (
    <TestContext.Provider
      value={{
        // filterByBranch,
        // filterByStatus,
        filterByText: filterByTextDeferred,
        filterByTextForDisplay: filterByText,
        selectTestId: setTestId,
        // setFilterByBranch,
        // setFilterByStatus,
        setFilterByText,
        testId: deferredTestId,
        testIdForDisplay: testId,
        tests,
      }}
    >
      {children}
    </TestContext.Provider>
  );
}
