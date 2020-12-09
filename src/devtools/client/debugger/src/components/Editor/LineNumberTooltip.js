import React, { useRef, useState, useEffect } from "react";
import { connect } from "../../utils/connect";

import ReactDOM from "react-dom";
import "./LineNumberTooltip.css";
import { selectors } from "ui/reducers";

function LineNumberTooltip({ targetNode, analysisPointsForLocation, breakpointPosition }) {
  const [ready, setReady] = useState(false);
  const timeoutKey = useRef(null);

  useEffect(function debounceTooltip() {
    timeoutKey.current = setTimeout(() => setReady(true), 250);

    return () => {
      clearTimeout(timeoutKey);
    };
  }, []);

  if (!targetNode || !ready || !analysisPointsForLocation) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="line-number-tooltip">{analysisPointsForLocation.length} hits</div>,
    targetNode
  );
}

export default connect((state, { location }) => ({
  breakpointPosition: selectors.getFirstBreakpointPosition(state, location),
  analysisPointsForLocation: selectors.getAnalysisPointsForLocation(
    state,
    selectors.getFirstBreakpointPosition(state, location)
  ),
}))(LineNumberTooltip);
