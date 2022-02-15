import React, { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { connect, ConnectedProps } from "react-redux";

import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

function IndexingLoader({
  progressPercentage,
  viewMode,
}: Pick<PropsFromRedux, "progressPercentage" | "viewMode">) {
  const [isDone, setDone] = useState(false);

  // Set the indexing loader to done immediately, if
  // the loader just mounted and is at 100
  useEffect(() => {
    if (progressPercentage == 100) {
      setDone(true);
    }
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isDone && progressPercentage == 100) {
      timeout = setTimeout(() => setDone(true), 2000);
    }

    return () => clearTimeout(timeout);
  }, [progressPercentage]);

  if (isDone || progressPercentage === null || viewMode == "non-dev") {
    return null;
  }

  return (
    <div className="absolute h-7 w-7" title={`Indexing (${progressPercentage.toFixed()}%)`}>
      <CircularProgressbar
        value={progressPercentage}
        strokeWidth={14}
        styles={buildStyles({ pathColor: `#0074E8`, trailColor: `transparent` })}
      />
    </div>
  );
}

const connector = connect((state: UIState) => ({
  progressPercentage: selectors.getIndexing(state),
  viewMode: selectors.getViewMode(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(IndexingLoader);
