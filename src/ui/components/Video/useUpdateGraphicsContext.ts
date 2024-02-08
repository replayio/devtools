import { ScreenShot } from "@replayio/protocol";
import { useLayoutEffect } from "react";

import { update } from "ui/components/Video/MutableGraphicsState";

export function useUpdateGraphicsContext(screenShot: ScreenShot | undefined) {
  // Whenever we render a new screenshot, update the bounding rect and scale info
  useLayoutEffect(() => {
    const imageElement = document.getElementById("graphics");
    if (imageElement != null && screenShot != null) {
      update({ element: imageElement as HTMLImageElement, scale: screenShot.scale });
    }

    repositionGraphics();
  });

  // Whenever the video element resizes, update the bounding rect info
  useLayoutEffect(() => {
    const element = document.getElementById("video");
    if (element) {
      const observer = new ResizeObserver(() => {
        repositionGraphics();

        const imageElement = document.getElementById("graphics");
        if (imageElement != null) {
          update({ element: imageElement as HTMLImageElement });
        }
      });

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }
  }, []);
}

function repositionGraphics() {
  const container = document.getElementById("video");
  const graphicsElement = document.getElementById("graphics");
  const overlayGraphicsElement = document.getElementById("overlay-graphics");

  if (container != null && graphicsElement != null && overlayGraphicsElement != null) {
    const containerRect = container.getBoundingClientRect();
    const imageRect = graphicsElement.getBoundingClientRect();

    overlayGraphicsElement.style.left = `${imageRect.left - containerRect.left}px`;
    overlayGraphicsElement.style.top = `${imageRect.top - containerRect.top}px`;
    overlayGraphicsElement.style.width = `${imageRect.width}px`;
    overlayGraphicsElement.style.height = `${imageRect.height}px`;
  }
}
