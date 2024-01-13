import orderBy from "lodash/orderBy";
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

import { Test } from "shared/test-suites/TestRun";
import { trackEvent } from "ui/utils/telemetry";

import { useGetTeamRouteParams } from "../../utils";
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
  const router = useRouter();
  const { teamId, testOrTestRunId } = useGetTeamRouteParams();
  const { tests, status } = useTests();

  const [localTestId, setTestId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<TestsContextType["sortBy"]>("failureRate");
  const [filterByText, setFilterByText] = useState("");

  useEffect(() => {
    setTestId(testOrTestRunId);
  }, [testOrTestRunId]);

  const filterByTextDeferred = useDeferredValue(filterByText);
  const deferredTestId = useDeferredValue(localTestId);

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
        router.push(`/team/${teamId}/tests/${id}`);
        trackEvent("test_dashboard.select_test", { view: "tests" });
      },
      setSortBy,
      setFilterByText,
      testId: deferredTestId,
      testIdForDisplay: testOrTestRunId,
      selectedTest: testOrTestRunId ? tests.find(t => t.testId === testOrTestRunId) ?? null : null,
      testsLoading: status === STATUS_PENDING,
      tests: filteredTests,
      testsCount: status === STATUS_PENDING ? 0 : tests.length,
    };
  }, [sortBy, filterByText, filterByTextDeferred, deferredTestId, testOrTestRunId, status, tests]);

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
}
