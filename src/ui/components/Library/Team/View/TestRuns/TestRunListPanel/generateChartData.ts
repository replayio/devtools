import groupBy from "lodash/groupBy";

import { TestRun } from "shared/test-suites/TestRun";
import { ChartDataType } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/types";

export function generateChartData(testRuns: TestRun[], days: number) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const runsGroupedByDay = groupBy(
    testRuns.map(({ date: dateString, ...rest }) => {
      const date = new Date(dateString);
      const groupByKey = formatter.format(date);

      return {
        ...rest,
        date,
        __groupByKey: groupByKey,
      };
    }),
    "__groupByKey"
  );

  const displayedDates: Date[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(new Date().getTime() - i * (24 * 60 * 60 * 1000));

    displayedDates.unshift(date);
  }

  return displayedDates.reduce((chartData: ChartDataType[], date: Date) => {
    const groupByKey = formatter.format(date);
    const runs = runsGroupedByDay[groupByKey];

    let numRunsFailed = 0;
    let numRunsPassed = 0;
    let numTestsFailed = 0;
    let numTestsPassed = 0;

    if (runs != null) {
      runs.forEach(run => {
        const { failed, passed } = run.results.counts;
        if (failed > 0) {
          numRunsFailed++;
        } else {
          numRunsPassed++;
        }

        numTestsFailed += failed;
        numTestsPassed += passed;
      });
    }

    chartData.push({ date, numRunsFailed, numRunsPassed, numTestsFailed, numTestsPassed });

    return chartData;
  }, []);
}
