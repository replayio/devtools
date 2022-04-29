import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { useSelector } from "react-redux";
import { getIndexingProgress } from "ui/reducers/app";

export default function IndexingLoader() {
  const progress = useSelector(getIndexingProgress);

  if (progress === 100 || progress === null) {
    return null;
  }

  return (
    <div className="absolute h-7 w-7" title={`Indexing (${progress.toFixed()}%)`}>
      <CircularProgressbar
        value={progress}
        strokeWidth={14}
        styles={buildStyles({ pathColor: `#0074E8`, trailColor: `var(--theme-base-100)` })}
      />
    </div>
  );
}
