import { getDevicePixelRatio } from "protocol/graphics";

// Get the x/y coordinate of a mouse event wrt the recording's DOM.
export function mouseEventCanvasPosition(
  event: MouseEvent,
  canvas: HTMLElement
): { x: number; y: number } | undefined {
  const bounds = canvas.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  ) {
    // Not in the canvas.
    return undefined;
  }

  const scale = bounds.width / canvas.offsetWidth;
  const pixelRatio = getDevicePixelRatio();
  if (!pixelRatio) {
    return undefined;
  }

  return {
    x: (event.clientX - bounds.left) / scale / pixelRatio,
    y: (event.clientY - bounds.top) / scale / pixelRatio,
  };
}
