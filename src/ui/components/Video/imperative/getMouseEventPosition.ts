import { state } from "ui/components/Video/imperative/MutableGraphicsState";

// Get the x/y coordinate of a mouse event relative to the recording's DOM.
export function getMouseEventPosition(event: MouseEvent) {
  const { graphicsRect, localScale, recordingScale } = state.read();
  const { height, left, top, width } = graphicsRect;

  if (
    event.clientX < left ||
    event.clientX > left + width ||
    event.clientY < top ||
    event.clientY > top + height
  ) {
    // Outside of the rendered screenshot
    return undefined;
  }

  return {
    x: (event.clientX - left) / localScale / recordingScale,
    y: (event.clientY - top) / localScale / recordingScale,
  };
}
