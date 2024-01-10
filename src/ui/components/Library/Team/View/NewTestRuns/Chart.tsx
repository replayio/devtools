import { CartesianMarkerProps } from "@nivo/core";
import { Point } from "@nivo/line";
import groupBy from "lodash/groupBy";
import dynamic from "next/dynamic";
import { useContext, useMemo, useState } from "react";

import useTooltip from "replay-next/src/hooks/useTooltip";
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

    // Format the dates like MM/DD
    acc.push({ x: date.split("-").slice(1).join("/"), y: failureRate });
    return acc;
  }, [] as ChartDataType[]);

  return [
    {
      id: "Failure rate (%)",
      color: "var(--testsuites-graph-gradient-stroke)",
      data: sortedData,
    },
  ];
}

export const Chart = () => {
  const { testRuns } = useContext(TestRunsContext);
  const data = useMemo(() => generateChartData(testRuns), [testRuns]);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);

  const { onMouseEnter, onMouseLeave, tooltip } = useTooltip({
    tooltip: hoveredPoint ? (
      <PointTooltip
        date={hoveredPoint.data.x as string}
        failureRate={hoveredPoint.data.y as number}
      />
    ) : null,
  });

  const markers: CartesianMarkerProps[] = [
    {
      axis: "y",
      value: 100,
      lineStyle: { stroke: "var(--testsuites-graph-marker)", strokeWidth: 1 },
      legendOrientation: "vertical",
    },
    {
      axis: "y",
      value: 50,
      lineStyle: {
        stroke: "var(--testsuites-graph-gradient-marker)",
        strokeWidth: 1,
        strokeOpacity: 0.4,
      },
      legendOrientation: "vertical",
    },
    {
      axis: "y",
      value: 0,
      lineStyle: { stroke: "var(--testsuites-graph-marker)", strokeWidth: 1 },
      legendOrientation: "vertical",
    },
  ];

  const gradientId = "gradientBlue";

  return (
    <div style={{ height: 88, minWidth: 50 }}>
      <svg style={{ height: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop
              offset="0%"
              stopColor="var(--testsuites-graph-gradient-start)"
              stopOpacity="var(--testsuites-graph-gradient-end-opacity)"
            />
            <stop
              offset="100%"
              stopColor="var(--testsuites-graph-gradient-end)"
              stopOpacity={100}
            />
          </linearGradient>
        </defs>
      </svg>
      <ResponsiveLine
        data={data}
        markers={markers}
        margin={{ top: 10, right: 10, bottom: 10, left: 4 }}
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
        pointSize={4}
        pointColor={{ theme: "background" }}
        pointBorderWidth={3}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
        enableArea={true}
        areaOpacity={0.8}
        enableGridX={false}
        enableGridY={false}
        animate={false}
        tooltip={() => null}
        onMouseEnter={(point, event) => {
          onMouseEnter(event);
          setHoveredPoint(point);
        }}
        onMouseLeave={(point, event) => {
          onMouseLeave(event);
          setHoveredPoint(null);
        }}
        onMouseMove={(point, event) => {
          onMouseEnter(event);
          if (hoveredPoint?.id !== point.id) {
            setHoveredPoint(point);
          }
        }}
        theme={{ text: { fill: "var(--body-color)" } }}
        colors={{ datum: "color" }}
        areaBaselineValue={0}
        // Reference the gradient for the area color
        areaBlendMode="normal"
        defs={[
          {
            id: gradientId,
            type: "linearGradient",
            colors: [
              { offset: 0, color: "white" },
              { offset: 100, color: "white" },
            ],
          },
        ]}
        fill={[{ match: "*", id: gradientId }]}
      />
      {tooltip}
    </div>
  );
};

function PointTooltip({ date, failureRate }: { date: string; failureRate: number }) {
  return (
    <div className="flex gap-1">
      <div>({date})</div>
      <div>{failureRate.toFixed(0)}%</div>
    </div>
  );
}
