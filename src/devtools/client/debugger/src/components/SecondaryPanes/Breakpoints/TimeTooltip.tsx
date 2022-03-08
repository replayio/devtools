import React from "react";

export default function TimeTooltip({ time }: { time: number | null }) {
  if (!time) {
    return null;
  }

  const date = new Date(time || 0);
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const minutes = date.getMinutes();

  return (
    <div className="time-tooltip bottom-1 rounded-md border border-splitter p-1 py-0.5 text-xs">
      {`${minutes}:${seconds}`}
    </div>
  );
}
