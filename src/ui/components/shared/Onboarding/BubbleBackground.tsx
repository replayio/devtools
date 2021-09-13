import React from "react";

export default function BubbleBackground() {
  return (
    <div className="w-full h-full">
      <div className="absolute">
        <img
          src="/images/bubble.svg"
          className="transform rotate-90 -translate-x-1/2 -translate-y-1/2 "
          style={{ width: "75vw" }}
        />
      </div>
      <div className="absolute bottom-0 right-0">
        <img
          src="/images/bubble.svg"
          className="transform -rotate-90 translate-x-1/2 translate-y-1/2"
          style={{ width: "75vw" }}
        />
      </div>
    </div>
  );
}
