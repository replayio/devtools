import { Point, PointTooltipProps } from "@nivo/line";
import groupBy from "lodash/groupBy";
import dynamic from "next/dynamic";
import { useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";

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
      color: "hsl(21, 70%, 50%)",
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

  return (
    <div style={{ height: 80, minWidth: 360 }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
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
        tooltip={() => null}
        onMouseEnter={(p, e) => {
          onMouseEnter(e);
          setHoveredPoint(p);
        }}
        onMouseLeave={(p, e) => {
          onMouseLeave(e);
          setHoveredPoint(null);
        }}
        onMouseMove={(p, e) => {
          onMouseEnter(e);
          if (hoveredPoint?.id !== p.id) {
            setHoveredPoint(p);
          }
        }}
        theme={{ text: { fill: "var(--body-color)" } }}
        colors={{ scheme: "set1" }}
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
