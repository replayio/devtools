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

  const sortedData = sortedDates.reduce((acc, date) => {
    const runs = groupedRuns[date];
    const failureRate = runs.filter(r => r.results.counts.failed > 0).length / runs.length;

    // Format the dates like MM/DD
    acc.push({ x: date.split("-").slice(1).join("/"), y: failureRate });
    return acc;
  }, [] as ChartDataType[]);

  return [
    {
      id: "build-failures",
      color: "hsl(21, 70%, 50%)",
      data: sortedData,
    },
  ];
}
export const Chart = () => {
  const { testRuns } = useContext(TestRunsContext);
  const data = useMemo(() => generateChartData(testRuns), [testRuns]);

  return (
    <div className="flex flex-col overflow-auto rounded-lg bg-chrome p-4">
      <div className="font-bold">Build failures trend (percentage of builds failed)</div>
      <div style={{ height: 160, minWidth: 640 }}>
        <ResponsiveLine
          data={data}
          margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            min: 0,
            max: 1,
            stacked: true,
            reverse: false,
          }}
          gridYValues={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          yFormat=" >%"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legendOffset: 36,
            legendPosition: "middle",
          }}
          axisLeft={{
            tickValues: 4,
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legendOffset: -40,
            legendPosition: "middle",
          }}
          enablePoints={false}
          pointSize={10}
          pointColor={{ theme: "background" }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          pointLabelYOffset={-12}
          useMesh={false}
          enableGridX={false}
          theme={{ text: { fill: "var(--body-color)" } }}
          colors={{ scheme: "set1" }}
        />
      </div>
    </div>
  );
};
