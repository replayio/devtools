import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { useSelector } from "react-redux";

import { selectors } from "ui/reducers";

export default function RegionsLoader() {
  const viewMode = useSelector(selectors.getViewMode);
  const progress = useSelector(selectors.getLoadingProgress);

  if (progress === null || viewMode == "non-dev") {
    return null;
  }

  return (
    <div className="absolute h-7 w-7" title={`Loading (${progress.toFixed()}%)`}>
      <CircularProgressbar
        value={progress}
        strokeWidth={14}
        styles={buildStyles({ pathColor: `#0074E8`, trailColor: `#CCC` })}
      />
    </div>
  );
}
