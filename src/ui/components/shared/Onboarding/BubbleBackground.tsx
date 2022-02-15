import React from "react";

export default function BubbleBackground() {
  return (
    <div className="pointer-events-none absolute h-full w-full">
      <div className="top-bubble absolute">
        <img
          src="/images/bubble.svg"
          className="-translate-x-1/2 -translate-y-1/2 rotate-90 transform"
        />
      </div>
      <div className="bottom-bubble absolute">
        <img
          src="/images/bubble.svg"
          className="-rotate-300 translate-x-1/2 translate-y-1/2 transform"
        />
      </div>
    </div>
  );
}
