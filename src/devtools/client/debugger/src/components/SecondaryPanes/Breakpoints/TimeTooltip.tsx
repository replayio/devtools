import React from "react";

export default function TimeTooltip({ time }: { time: number }) {
  const date = new Date(time || 0);
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const minutes = date.getMinutes();

  return (
    <div className="text-xs bg-toolbarBackground p-1 py-0.5 border border-splitter rounded-md bottom-1">
      {`${minutes}:${seconds}`}
    </div>
  );
}
