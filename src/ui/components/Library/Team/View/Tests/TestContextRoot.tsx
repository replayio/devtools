import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import { Test, getTestRunTitle } from "shared/test-suites/TestRun";

import { useTests } from "./hooks/useTests";

type TestsContextType = {
  sortBy: "failureRate";
  filterByTime: number | null;
  filterByText: string;
  filterByTextForDisplay: string;
  selectTestId: Dispatch<SetStateAction<string | null>>;
  setSortBy: Dispatch<SetStateAction<"failureRate">>;
  setFilterByTime: Dispatch<SetStateAction<number | null>>;
  setFilterByText: Dispatch<SetStateAction<string>>;
  testId: string | null;
  testIdForDisplay: string | null;
  tests: Test[];
};

export const TestContext = createContext<TestsContextType>(null as any);

export function TestsContextRoot({ children }: { children: ReactNode }) {
  const tests = useTests();

  const [testId, setTestId] = useState<string | null>(null);

  const [filterByTime, setFilterByTime] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"failureRate">("failureRate");

  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);

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
        filterByTime,
        sortBy,
        filterByText: filterByTextDeferred,
        filterByTextForDisplay: filterByText,
        selectTestId: setTestId,
        setFilterByTime,
        setSortBy,
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
