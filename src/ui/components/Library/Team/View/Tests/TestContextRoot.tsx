import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import { Test } from "shared/test-suites/TestRun";

import { useTests } from "./hooks/useTests";

type TestsContextType = {
  sortBy: "failureRate" | "alphabetical";
  filterByTime: number | null;
  filterByText: string;
  filterByTextForDisplay: string;
  selectTestId: Dispatch<SetStateAction<string | null>>;
  setSortBy: Dispatch<SetStateAction<"failureRate" | "alphabetical">>;
  setFilterByTime: Dispatch<SetStateAction<number | null>>;
  setFilterByText: Dispatch<SetStateAction<string>>;
  testId: string | null;
  testIdForDisplay: string | null;
  selectedTest: Test | null;
  tests: Test[];
};

export const TestContext = createContext<TestsContextType>(null as any);

export function TestsContextRoot({ children }: { children: ReactNode }) {
  const tests = useTests();

  const [testId, setTestId] = useState<string | null>(null);

  const [filterByTime, setFilterByTime] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"failureRate" | "alphabetical">("failureRate");

  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);
  const deferredTestId = useDeferredValue(testId);

  const value = useMemo(() => {
    let filteredTests = tests;

    if (filterByText !== "") {
      const lowerCaseText = filterByText.toLowerCase();

      filteredTests = filteredTests.filter(test => {
        if (filterByText !== "") {
          const { title } = test;

          if (!title.toLowerCase().includes(lowerCaseText)) {
            return false;
          }
        }

        return true;
      });
    }

    return {
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
      selectedTest: testId ? tests.find(t => t.testId === testId) ?? null : null,
      tests: filteredTests,
    };
  }, [filterByTime, sortBy, filterByText, filterByTextDeferred, deferredTestId, testId, tests]);

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
}
