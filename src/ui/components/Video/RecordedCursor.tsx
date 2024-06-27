import assert from "assert";
import { useLayoutEffect, useRef } from "react";

import { findMostRecentClickEvent, findMostRecentMouseEvent } from "protocol/RecordedEventsCache";
import { state } from "ui/components/Video/imperative/MutableGraphicsState";

// One frame seems reasonable for a click to be considered
// recent enough to be drawn on the screen
const CLICK_TIMING_THRESHOLD_MS = 16.67;

export function RecordedCursor() {
  const elementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    assert(element);

    // Imperatively position and scale these graphics to avoid "render lag" when resizes occur
    const unsubscribe = state.listen(
      ({ currentTime, graphicsRect, localScale, recordingScale }) => {
        const { height, width } = graphicsRect;

        const mouseEvent = findMostRecentMouseEvent(currentTime);
        const clickEvent = findMostRecentClickEvent(currentTime);
        const shouldDrawClick =
          clickEvent && clickEvent.time + CLICK_TIMING_THRESHOLD_MS >= currentTime;

        if (mouseEvent) {
          const originalHeight = height / localScale;
          const originalWidth = width / localScale;

          const mouseX = (mouseEvent.clientX / originalWidth) * 100;
          const mouseY = (mouseEvent.clientY / originalHeight) * 100;

          const cursorScale = Math.min(1, Math.max(0.25, localScale * recordingScale));

          element.style.display = "block";
          element.style.left = `${mouseX}%`;
          element.style.top = `${mouseY}%`;
          element.style.transform = `scale(${cursorScale})`;
          element.style.setProperty("--click-display", shouldDrawClick ? "block" : "none");
        } else {
          element.style.display = "none";
          element.style.setProperty("--click-display", "none");
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div
      ref={elementRef}
      style={{
        display: "none",
        position: "absolute",
      }}
    >
      <div
        style={{
          display: "var(--click-display)",
          position: "absolute",
          left: -15,
          top: -15,
          width: 30,
          height: 30,
          borderWidth: 3,
          borderRadius: "100%",
          borderColor: "black",
        }}
      />
      <svg width={16} height={24} viewBox="0 0 16 24" fill="none" style={{ position: "absolute" }}>
        <path
          d="M1.33114 0.625374C1.18381 0.495139 0.973814 0.463359 0.794539 0.544165C0.615264 0.624971 0.5 0.803356 0.5 1V19.15C0.5 19.3466 0.615264 19.525 0.794539 19.6058C0.973813 19.6866 1.18381 19.6549 1.33114 19.5246L5.50025 15.8394L9.00677 23.2147C9.12142 23.4558 9.40531 23.5643 9.65158 23.4611L12.2766 22.3611C12.4026 22.3083 12.5016 22.2062 12.5504 22.0785C12.5992 21.9508 12.5936 21.8088 12.5349 21.6853L9.0541 14.3642L15.0409 13.8733C15.2406 13.857 15.4112 13.7229 15.4745 13.5328C15.5377 13.3426 15.4813 13.1331 15.3311 13.0004L1.33114 0.625374Z"
          fill="black"
          stroke="white"
          strokeLinejoin="round"
          strokeWidth={2}
        ></path>
      </svg>
    </div>
  );
}
