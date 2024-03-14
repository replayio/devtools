import { getChartCoordinates } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/getChartCoordinates";
import { ChartDataType } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/types";

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
    const { x, y } = getChartCoordinates({ data, height, index, width });

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
    const { x, y } = getChartCoordinates({ data, height, index, width });

    // Circles
    context.beginPath();
    context.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI);
    context.lineWidth = 0;
    context.fillStyle = index === highlightIndex ? highlightMarkerColor : markerColor;
    context.fill();
    context.closePath();
  }
}
