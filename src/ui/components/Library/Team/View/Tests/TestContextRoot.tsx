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
  filterCriterion: "failureRate" | "flakyRate" | "alphabetical";
  filterByText: string;
  filterByTextForDisplay: string;
  selectTestId: (testId: string | null) => void;
  setFilterCriterion: Dispatch<SetStateAction<TestsContextType["filterCriterion"]>>;
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

  const [filterCriterion, setFilterCriterion] =
    useState<TestsContextType["filterCriterion"]>("failureRate");

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

    if (filterCriterion === "alphabetical") {
      filteredTests = orderBy(filteredTests, "title", "asc");
    } else {
      filteredTests = filteredTests.filter(test => test[filterCriterion] > 0);
      filteredTests = orderBy(filteredTests, filterCriterion, "desc");
    }

    return {
      filterCriterion,
      filterByText: filterByTextDeferred,
      filterByTextForDisplay: filterByText,
      selectTestId: (id: string | null) => {
        trackEvent("test_dashboard.select_test", { view: "tests" });
        setTestId(id);
      },
      setFilterCriterion,
      setFilterByText,
      testId: deferredTestId,
      testIdForDisplay: testId,
      selectedTest: testId ? tests.find(t => t.testId === testId) ?? null : null,
      testsLoading: status === STATUS_PENDING,
      tests: filteredTests,
      testsCount: status === STATUS_PENDING ? 0 : tests.length,
    };
  }, [filterCriterion, filterByText, filterByTextDeferred, deferredTestId, testId, status, tests]);

  useSyncTestIdToUrl(teamId, testId, setTestId);

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
}
