import React, { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { useSelector } from "react-redux";
import { getIndexingProgress } from "ui/reducers/app";
import { getViewMode } from "ui/reducers/layout";

export default function IndexingLoader() {
  const progress = useSelector(getIndexingProgress);
  const viewMode = useSelector(getViewMode);
  const [isDone, setDone] = useState(false);

  // Set the indexing loader to done immediately, if
  // the loader just mounted and is at 100
  useEffect(() => {
    if (progress == 100) {
      setDone(true);
    }
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isDone && progress == 100) {
      timeout = setTimeout(() => setDone(true), 2000);
    }

    return () => clearTimeout(timeout);
  }, [progress]);

  if (progress === null || viewMode == "non-dev") {
    return null;
  }

  console.log({ progress });

  return (
    <div className="absolute h-7 w-7" title={`Indexing (${progress.toFixed()}%)`}>
      <CircularProgressbar
        value={progress}
        strokeWidth={14}
        styles={buildStyles({ pathColor: `#0074E8`, trailColor: `gray` })}
      />
    </div>
  );
}
