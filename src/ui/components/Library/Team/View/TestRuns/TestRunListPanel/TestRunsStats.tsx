import { useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";

import useTooltip from "replay-next/src/hooks/useTooltip";
import { TestRun } from "shared/test-suites/TestRun";
import { useTheme } from "shared/theme/useTheme";
import { drawChart } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/drawChart";
import { generateChartData } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/generateChartData";
import { getChartTooltip } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/getChartTooltip";
import { TimeFilterContext } from "ui/components/Library/Team/View/TimeFilterContextRoot";

import { useTestRunsSuspends } from "../hooks/useTestRunsSuspends";
import styles from "./TestRunsStats.module.css";

export function TestRunsStats() {
  const { filteredSortedTestRuns: testRuns } = useTestRunsSuspends();

  const { numRunsFailed, numRunsPassed } = useMemo(() => {
    let numRunsFailed = 0;
    let numRunsPassed = 0;

    testRuns.forEach(testRun => {
      const { failed } = testRun.results.counts;

      if (failed > 0) {
        numRunsFailed++;
      } else {
        numRunsPassed++;
      }
    });

    return {
      numRunsFailed,
      numRunsPassed,
    };
  }, [testRuns]);

  if (!testRuns.length) {
    return null;
  }

  const numRunsTotal = numRunsFailed + numRunsPassed;
  const runFailureRate = Math.round((numRunsFailed / numRunsTotal) * 100);

  return (
    <div className={styles.TestRunsStats}>
      <div className={styles.ChartWrapper}>
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <ChartWithDimensions height={height} testRuns={testRuns} width={width} />
          )}
        </AutoSizer>
      </div>
      <div
        className={styles.FailureRateDescription}
        data-test-id="TestRunStats-ChartSummaryLabel"
        title={`${numRunsFailed}/${numRunsTotal} failed`}
      >
        <strong>Failure rate:</strong> {runFailureRate}%
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

  const [hoverData, setHoverData] = useState<{
    chart: "bar" | "line";
    index: number;
  } | null>(null);

  const hoverIndex = hoverData?.index ?? null;

  let tooltipContent = null;
  if (hoverIndex !== null) {
    tooltipContent = <div className={styles.Tooltip}>{getChartTooltip(data[hoverIndex])}</div>;
  }

  const { onMouseEnter, onMouseMove, onMouseLeave, tooltip } = useTooltip({
    tooltip: <div className={styles.Tooltip}>{tooltipContent}</div>,
  });

  const theme = useTheme();

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (canvas) {
      drawChart({ canvas, data, height, highlightIndex: hoverIndex, width });

      const onMouseLeave = () => {
        setHoverData(null);
      };

      const onMouseMove = (event: MouseEvent) => {
        // Show a tooltip for the nearest dot
        const spacing = width / (data.length - 1);
        const index = Math.round(Math.max(0, event.offsetX) / spacing);

        setHoverData({
          chart: event.offsetY < height * 0.33 ? "bar" : "line",
          index,
        });
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
