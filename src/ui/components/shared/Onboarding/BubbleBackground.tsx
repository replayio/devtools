import React from "react";

export default function BubbleBackground() {
  return (
    <div className="w-full h-full absolute">
      <div className="absolute top-bubble">
        <img
          src="/images/bubble.svg"
          className="transform rotate-90 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <div className="absolute bottom-bubble">
        <img
          src="/images/bubble.svg"
          className="transform -rotate-300 translate-x-1/2 translate-y-1/2"
        />
      </div>
    </div>
  );
}
