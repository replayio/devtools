import orderBy from "lodash/orderBy";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { STATUS_PENDING } from "suspense";

import { Test } from "shared/test-suites/TestRun";
import { trackEvent } from "ui/utils/telemetry";

import { useGetTeamRouteParams } from "../../utils";
import { useSyncTestIdToUrl } from "./hooks/useSyncTestIdToUrl";
import { useTests } from "./hooks/useTests";

type TestsContextType = {
  sortBy: "failureRate" | "flakyRate" | "alphabetical";
  filterByText: string;
  filterByTextForDisplay: string;
  selectTestId: (testId: string | null) => void;
  setSortBy: Dispatch<SetStateAction<TestsContextType["sortBy"]>>;
  setFilterByText: Dispatch<SetStateAction<string>>;
  testId: string | null;
  testIdForDisplay: string | null;
  selectedTest: Test | null;
  testsLoading: boolean;
  tests: Test[];
  testsCount: number;
};

export const TestContext = createContext<TestsContextType>(null as any);

export function TestsContextRoot({ children }: { children: ReactNode }) {
  const { teamId } = useGetTeamRouteParams();
  const { tests, status } = useTests();

  const [testId, setTestId] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<TestsContextType["sortBy"]>("failureRate");

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

    if (sortBy === "alphabetical") {
      filteredTests = orderBy(filteredTests, "title", "asc");
    } else {
      filteredTests = orderBy(filteredTests, sortBy, "desc");
    }

    return {
      sortBy,
      filterByText: filterByTextDeferred,
      filterByTextForDisplay: filterByText,
      selectTestId: (id: string | null) => {
        trackEvent("test_dashboard.select_test", { view: "tests" });
        setTestId(id);
      },
      setSortBy,
      setFilterByText,
      testId: deferredTestId,
      testIdForDisplay: testId,
      selectedTest: testId ? tests.find(t => t.testId === testId) ?? null : null,
      testsLoading: status === STATUS_PENDING,
      tests: filteredTests,
      testsCount: status === STATUS_PENDING ? 0 : tests.length,
    };
  }, [sortBy, filterByText, filterByTextDeferred, deferredTestId, testId, status, tests]);

  useSyncTestIdToUrl(teamId, testId, setTestId);

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
}
