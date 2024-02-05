import groupBy from "lodash/groupBy";
import { useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";

import useTooltip from "replay-next/src/hooks/useTooltip";
import { TestRun } from "shared/test-suites/TestRun";
import { useTheme } from "shared/theme/useTheme";
import { TimeFilterContext } from "ui/components/Library/Team/View/TimeFilterContextRoot";

import { useTestRunsSuspends } from "../hooks/useTestRunsSuspends";
import styles from "./TestRunsStats.module.css";

type ChartDataType = { failureRate: number; label: string };

const LINE_WIDTH = 2;
const PADDING = 4;
const POINT_RADIUS = 4;

export function TestRunsStats() {
  const { filteredSortedTestRuns: testRuns } = useTestRunsSuspends();

  if (!testRuns.length) {
    return null;
  }

  const buildsCount = testRuns.length;
  const buildFailuresCount = testRuns.filter(r => r.results.counts.failed > 0).length;
  const buildFailureRate = buildFailuresCount / buildsCount;

  return (
    <div className={styles.TestRunsStats}>
      <div className={styles.ChartWrapper}>
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <ChartWithDimensions height={height} testRuns={testRuns} width={width} />
          )}
        </AutoSizer>
      </div>
      <div className={styles.FailureRateDescription} title={`${buildFailuresCount}/${buildsCount}`}>
        <strong>Failure rate:</strong> {(buildFailureRate * 100).toFixed(2)}%
      </div>
    </div>
  );
}

function ChartWithDimensions({
  height,
  testRuns,
  width,
}: {
  height: number;
  testRuns: TestRun[];
  width: number;
}) {
  const { startTime, endTime } = useContext(TimeFilterContext);

  const ref = useRef<HTMLCanvasElement>(null);

  const days = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60 / 60 / 24);
  const data = useMemo(() => generateChartData(testRuns, days), [testRuns, days]);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  let tooltipContent = null;
  if (hoverIndex !== null) {
    const point = data[hoverIndex];

    tooltipContent = `(${point.label}) ${Math.round(point.failureRate * 100)}%`;
  }

  const { onMouseEnter, onMouseMove, onMouseLeave, tooltip } = useTooltip({
    tooltip: tooltipContent,
  });

  const theme = useTheme();

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (canvas) {
      drawChart({ canvas, data, height, highlightIndex: hoverIndex, width });

      const onMouseLeave = () => {
        setHoverIndex(null);
      };

      const onMouseMove = (event: MouseEvent) => {
        // Show a tooltip for the nearest dot
        const spacing = width / (data.length - 1);
        const index = Math.round(Math.max(0, event.offsetX) / spacing);

        setHoverIndex(index);
      };

      canvas.addEventListener("mouseleave", onMouseLeave);
      canvas.addEventListener("mousemove", onMouseMove);

      return () => {
        canvas.removeEventListener("mouseleave", onMouseLeave);
        canvas.removeEventListener("mousemove", onMouseMove);
      };
    }
  }, [data, height, hoverIndex, theme, width]);

  return (
    <>
      <canvas
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        ref={ref}
      />
      {tooltip}
    </>
  );
}

function drawChart({
  canvas,
  data,
  height,
  highlightIndex,
  width,
}: {
  canvas: HTMLCanvasElement;
  data: ChartDataType[];
  height: number;
  highlightIndex: number | null;
  width: number;
}) {
  const scale = window.devicePixelRatio;

  const style = getComputedStyle(canvas);
  const borderColor = style.getPropertyValue("--testsuites-graph-marker");
  const markerColor = style.getPropertyValue("--testsuites-graph-gradient-stroke");
  const gradientStartColor = style.getPropertyValue("--testsuites-graph-gradient-start");
  const gradientEndColor = style.getPropertyValue("--testsuites-graph-gradient-end");
  const highlightMarkerColor = style.getPropertyValue("--secondary-accent");

  canvas.style.height = `${height}px`;
  canvas.style.width = `${width}px`;
  canvas.height = height * scale;
  canvas.width = width * scale;

  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  context.scale(scale, scale);
  context.clearRect(0, 0, width, height);

  // Top and bottom lines
  context.beginPath();
  context.lineWidth = 1;
  context.strokeStyle = borderColor;
  context.moveTo(POINT_RADIUS, PADDING);
  context.lineTo(width - POINT_RADIUS, PADDING);
  context.stroke();
  context.moveTo(POINT_RADIUS, height - PADDING);
  context.lineTo(width - POINT_RADIUS, height - PADDING);
  context.stroke();
  context.closePath();

  let prevX = 0;
  let prevY = 0;

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, gradientStartColor);
  gradient.addColorStop(1, gradientEndColor);

  for (let index = 0; index < data.length; index++) {
    const { x, y } = getCoordinates({ data, height, index, width });

    if (index > 0) {
      // Gradient under fill
      context.beginPath();
      context.fillStyle = gradient;
      context.moveTo(prevX, prevY);
      context.lineTo(x, y);
      context.lineTo(x, height - PADDING);
      context.lineTo(prevX, height - PADDING);
      context.lineTo(prevX, prevY);
      context.fill();
      context.closePath();

      // Connecting lines
      context.beginPath();
      context.lineWidth = LINE_WIDTH;
      context.strokeStyle = markerColor;
      context.moveTo(prevX, prevY);
      context.lineTo(x, y);
      context.stroke();
      context.closePath();
    }

    prevX = x;
    prevY = y;
  }

  for (let index = 0; index < data.length; index++) {
    const { x, y } = getCoordinates({ data, height, index, width });

    // Circles
    context.beginPath();
    context.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI);
    context.lineWidth = 0;
    context.fillStyle = index === highlightIndex ? highlightMarkerColor : markerColor;
    context.fill();
    context.closePath();
  }
}

function generateChartData(testRuns: TestRun[], days: number) {
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

    let failureRate = 0;
    if (runs != null) {
      failureRate = runs.filter(r => r.results.counts.failed > 0).length / runs.length;
    }

    const label = `${date.toLocaleString("default", { month: "short" })} ${date.getDate()}`;

    chartData.push({ failureRate, label });

    return chartData;
  }, []);
}

function getCoordinates({
  data,
  height,
  index,
  width,
}: {
  data: ChartDataType[];
  index: number;
  height: number;
  width: number;
}) {
  const { failureRate } = data[index];

  const availableHeight = height - PADDING * 2;
  const availableWidth = width - PADDING * 2;
  const offset = PADDING;

  const y = height - offset - availableHeight * failureRate;

  let x = 0;
  if (data.length === 1) {
    x = width / 2;
  } else {
    x = offset + index * (availableWidth / (data.length - 1));
  }

  return {
    x,
    y,
  };
}
