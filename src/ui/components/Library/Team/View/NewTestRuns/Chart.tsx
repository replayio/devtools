import groupBy from "lodash/groupBy";
import dynamic from "next/dynamic";
import { useContext, useMemo } from "react";

import { TestRun } from "shared/test-suites/TestRun";

import { TestRunsContext } from "./TestRunsContextRoot";

// Workaround for import issues, see https://github.com/plouc/nivo/issues/2310#issuecomment-1552663752
export const ResponsiveLine = dynamic(() => import("@nivo/line").then(m => m.ResponsiveLine), {
  ssr: false,
});

type ChartDataType = { x: string; y: number };

const generateDateString = (date: string) => {
  const d = new Date(date);

  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

function generateChartData(testRuns: TestRun[]) {
  const groupedRuns = groupBy(
    testRuns.map(r => ({ ...r, _date: generateDateString(r.date) })),
    "_date"
  );

  const sortedDates = Object.keys(groupedRuns).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const displayedDates = sortedDates.length === 8 ? sortedDates.slice(1) : sortedDates;

  const sortedData = displayedDates.reduce((acc, date) => {
    const runs = groupedRuns[date];
    const failureRate = (runs.filter(r => r.results.counts.failed > 0).length / runs.length) * 100;
    const formattedFailureRate = failureRate.toFixed(0);

    // Format the dates like MM/DD
    acc.push({ x: date.split("-").slice(1).join("/"), y: formattedFailureRate });
    return acc;
  }, [] as ChartDataType[]);

  console.log({ sortedData });

  return [
    {
      id: "Failure rate (%)",
      color: "hsl(21, 70%, 50%)",
      data: sortedData,
    },
  ];
}
export const Chart = () => {
  const { testRuns } = useContext(TestRunsContext);
  const data = useMemo(() => generateChartData(testRuns), [testRuns]);

  return (
    <div style={{ height: 120, minWidth: 360 }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 20, right: 60, bottom: 10, left: 60 }}
        axisBottom={null}
        axisLeft={null}
        enablePoints={true}
        yScale={{
          type: "linear",
          min: 0,
          max: 100,
          stacked: true,
          reverse: false,
        }}
        pointSize={10}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
        enableArea={true}
        enableGridX={false}
        enableGridY={false}
        animate={false}
        theme={{ text: { fill: "var(--body-color)" } }}
        colors={{ scheme: "set1" }}
      />
    </div>
  );
};
