import { PADDING } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/drawChart";
import { ChartDataType } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/types";

export function getChartCoordinates({
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
  const { numRunsFailed, numRunsPassed } = data[index];

  const numRunsTotal = numRunsFailed + numRunsPassed;
  const failureRate = numRunsTotal === 0 ? 0 : numRunsFailed / numRunsTotal;

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
