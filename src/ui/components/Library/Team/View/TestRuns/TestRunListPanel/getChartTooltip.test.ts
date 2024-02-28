import { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

import { getChartTooltip } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/getChartTooltip";
import { ChartDataType } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/types";

function createChartDataType(data: Partial<ChartDataType>) {
  return {
    date: new Date("2000-01-01"),
    numRunsFailed: 0,
    numRunsPassed: 0,
    numTestsFailed: 0,
    numTestsPassed: 0,
    ...data,
  };
}

function expectToContainText(tooltip: ReactNode, ...expectedTexts: string[]) {
  const container = document.createElement("div");

  act(() => {
    const root = createRoot(container);
    root.render(tooltip);
  });

  expectedTexts.forEach(expectedText => {
    expect(container.textContent).toContain(expectedText);
  });
}

describe("getChartTooltip", () => {
  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it("should handle a day with no test runs", () => {
    expectToContainText(getChartTooltip(createChartDataType({})), "No tests were run on this day");
  });

  it("should handle a day with only failed test runs", () => {
    expectToContainText(
      getChartTooltip(
        createChartDataType({
          numRunsFailed: 15,
          numTestsFailed: 1575,
        })
      ),
      "All 15 test runs contained at least one failing test",
      "All 1,575 tests failed"
    );
  });

  it("should handle a day with only passing test runs", () => {
    expectToContainText(
      getChartTooltip(
        createChartDataType({
          numRunsPassed: 1000,
          numTestsPassed: 2500,
        })
      ),
      "All 1,000 test runs passed",
      "All 2,500 tests passed"
    );
  });

  it("should handle a day with a mix of passing and failing test runs", () => {
    expectToContainText(
      getChartTooltip(
        createChartDataType({
          numRunsFailed: 11,
          numRunsPassed: 40,
          numTestsFailed: 166,
          numTestsPassed: 5294,
        })
      ),
      "22% of 51 test runs contained at least one failing test",
      "166 tests failed out of 5,460 total tests"
    );
  });
});
