import { getChartCoordinates } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/getChartCoordinates";
import { ChartDataType } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/types";

export const BAR_WIDTH = 8;
export const BAR_GAP = 2;
export const LINE_WIDTH = 2;
export const PADDING = 4;
export const POINT_RADIUS = 4;

export function drawChart({
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
  const style = getComputedStyle(canvas);
  const borderColor = style.getPropertyValue("--testsuites-graph-marker");
  const markerColor = style.getPropertyValue("--testsuites-graph-gradient-stroke");
  const gradientStartColor = style.getPropertyValue("--testsuites-graph-gradient-start");
  const gradientEndColor = style.getPropertyValue("--testsuites-graph-gradient-end");
  const highlightMarkerColor = style.getPropertyValue("--secondary-accent");

  const scale = window.devicePixelRatio;

  canvas.style.height = `${height}px`;
  canvas.style.width = `${width}px`;
  canvas.height = height * scale;
  canvas.width = width * scale;

  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  context.scale(scale, scale);
  context.clearRect(0, 0, width, height);

  const barHeight = height * 0.33;
  const lineHeight = height * 0.67;

  // Boundary lines
  context.beginPath();
  context.fillStyle = borderColor;
  context.roundRect(0, 0, width, barHeight, 3);
  context.fill();
  context.closePath();
  context.beginPath();
  context.lineWidth = 1;
  context.strokeStyle = borderColor;
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
    const { numTestsFailed, numTestsPassed } = data[index];

    const numTestsTotal = numTestsFailed + numTestsPassed;

    let { x, y } = getChartCoordinates({ data, height: lineHeight, index, width });
    y += barHeight;

    // Bars
    {
      const maxBarHeight = barHeight - PADDING * 2;
      const failBarHeight = Math.max(2, (numTestsFailed / numTestsTotal) * maxBarHeight);
      const passBarHeight = Math.max(2, (numTestsPassed / numTestsTotal) * maxBarHeight);

      context.beginPath();
      context.fillStyle = "#d72451";
      context.roundRect(
        x - BAR_WIDTH - BAR_GAP / 2,
        barHeight - failBarHeight - PADDING,
        BAR_WIDTH,
        failBarHeight,
        1
      );
      context.fill();
      context.closePath();
      context.beginPath();
      context.fillStyle = "#31d710";
      context.roundRect(
        x + BAR_GAP / 2,
        barHeight - passBarHeight - PADDING,
        BAR_WIDTH,
        passBarHeight,
        1
      );
      context.fill();
      context.closePath();
    }

    if (index > 0) {
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
    let { x, y } = getChartCoordinates({ data, height: lineHeight, index, width });
    y += barHeight;

    // Circles
    context.beginPath();
    context.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI);
    context.lineWidth = 0;
    context.fillStyle = index === highlightIndex ? highlightMarkerColor : markerColor;
    context.fill();
    context.closePath();
  }
}
