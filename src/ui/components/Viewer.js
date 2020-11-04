import React, { useEffect, useState, useRef } from "react";
import RightSidebar from "./RightSidebar";
import Tooltip from "./Tooltip";
import { connect } from "react-redux";
import { selectors } from "../reducers";
import { actions } from "../actions";

function _Toast({ lastAnalysisPoints, setLastAnalysisPoints }) {
  // const [timeoutId, setTimeoutId] = useState(null);
  const timeoutId = useRef(null);

  useEffect(() => {
    if (lastAnalysisPoints === null) {
      return;
    }

    clearTimeout(timeoutId.current);

    timeoutId.current = id;
  }, [lastAnalysisPoints]);

  if (!lastAnalysisPoints) return null;

  const { length } = lastAnalysisPoints;
  const sub = `: This line was hit ${length} time${length ? "s" : ""}`;
  return <div className="toast">Logpoint Added{sub}</div>;
}

const Toast = connect(
  state => {
    return {
      // lastAnalysisPoints: selectors.getLastAnalysisPoints(state),
      analysisPoints: selectors.getAnalysisPoints(state),
    };
  },
  {
    // setLastAnalysisPoints: actions.setLastAnalysisPoints,
    setAnalysisPoints: actions.setAnalysisPoints,
  }
)(_Toast);

export default function Viewer({ tooltip }) {
  return (
    <div id="outer-viewer">
      {/*<Toast />*/}
      <div id="viewer">
        <canvas id="graphics"></canvas>
        <div id="highlighter-root"></div>
      </div>
      <RightSidebar />
      <Tooltip tooltip={tooltip} />
    </div>
  );
}
