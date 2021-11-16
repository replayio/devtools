import React, { ReactNode } from "react";

export function BubbleBackground() {
  return (
    <div className="w-full h-full absolute">
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

export default function BubbleModal({ children }: { children: ReactNode }) {
  return (
    <div
      className="w-full h-full grid fixed z-50 items-center justify-center"
      style={{ background: "#f3f3f4" }}
    >
      <BubbleBackground />
      <div className="relative">{children}</div>
    </div>
  );
}
