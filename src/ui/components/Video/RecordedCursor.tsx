import assert from "assert";
import { useContext, useLayoutEffect, useRef } from "react";

import { findMostRecentClickEvent, findMostRecentMouseEvent } from "protocol/RecordedEventsCache";
import { subscribe } from "ui/components/Video/MutableGraphicsState";

const CLICK_TIMING_THRESHOLD_MS = 200;

export function RecordedCursor({ time }: { time: number }) {
  const elementRef = useRef<HTMLDivElement>(null);

  const mouseEvent = findMostRecentMouseEvent(time);
  const shouldDrawCursor = mouseEvent != null;

  const clickEvent = findMostRecentClickEvent(time);
  const shouldDrawClick = clickEvent && clickEvent.time + CLICK_TIMING_THRESHOLD_MS >= time;

  useLayoutEffect(() => {
    const element = elementRef.current;
    assert(element);

    if (mouseEvent) {
      // Imperatively position and scale these graphics to avoid "render lag" when resizes occur
      return subscribe(state => {
        const { localScale, recordingScale } = state;

        const scale = recordingScale / localScale;
        let mouseX = mouseEvent.clientX / scale;
        let mouseY = mouseEvent.clientY / scale;

        element.style.left = `${mouseX}px`;
        element.style.top = `${mouseY}px`;
        element.style.transform = `scale(${localScale})`;
      });
    }
  }, [mouseEvent]);

  return (
    <div
      ref={elementRef}
      style={{
        position: "absolute",
      }}
    >
      {shouldDrawClick && (
        <div
          style={{
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
      )}
      {shouldDrawCursor && (
        <svg
          width={16}
          height={24}
          viewBox="0 0 16 24"
          fill="none"
          style={{ position: "absolute" }}
        >
          <path
            d="M1.33114 0.625374C1.18381 0.495139 0.973814 0.463359 0.794539 0.544165C0.615264 0.624971 0.5 0.803356 0.5 1V19.15C0.5 19.3466 0.615264 19.525 0.794539 19.6058C0.973813 19.6866 1.18381 19.6549 1.33114 19.5246L5.50025 15.8394L9.00677 23.2147C9.12142 23.4558 9.40531 23.5643 9.65158 23.4611L12.2766 22.3611C12.4026 22.3083 12.5016 22.2062 12.5504 22.0785C12.5992 21.9508 12.5936 21.8088 12.5349 21.6853L9.0541 14.3642L15.0409 13.8733C15.2406 13.857 15.4112 13.7229 15.4745 13.5328C15.5377 13.3426 15.4813 13.1331 15.3311 13.0004L1.33114 0.625374Z"
            fill="black"
            stroke="white"
            strokeLinejoin="round"
            strokeWidth={2}
          ></path>
        </svg>
      )}
    </div>
  );
}
