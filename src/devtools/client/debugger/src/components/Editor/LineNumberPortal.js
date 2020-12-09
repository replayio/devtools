import React, { useRef, useState, useEffect } from "react";
import { connect } from "../../utils/connect";

import ReactDOM from "react-dom";
import "./LineNumberPortal.css";
import { selectors } from "ui/reducers";

function LineNumberPortal({ targetNode, analysisPointsForLocation, breakpointPosition }) {
  const [ready, setReady] = useState(false);
  const timeoutKey = useRef(null);
  const mounted = useRef(false);

  useEffect(function debounceTooltipFirstRender() {
    mounted.current = true;

    timeoutKey.current = setTimeout(() => {
      if (mounted.current) {
        setReady(true);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutKey);
      mounted.current = false;
    };
  }, []);

  if (!ready || !targetNode || !analysisPointsForLocation) {
    return null;
  }

  return ReactDOM.createPortal(
    <LineNumberTooltip targetNode={targetNode} hits={analysisPointsForLocation.length} />,
    targetNode
  );
}

function LineNumberTooltip({ targetNode, hits }) {
  const { top, left } = targetNode.getBoundingClientRect();
  const docWidth = document.querySelector("html").getBoundingClientRect().width;

  return (
    <div className="line-number-tooltip" style={{ top: `${top}px`, right: `${docWidth - left}px` }}>
      {hits} hits
    </div>
  );
}

export default connect((state, { location }) => ({
  breakpointPosition: selectors.getFirstBreakpointPosition(state, location),
  analysisPointsForLocation: selectors.getAnalysisPointsForLocation(
    state,
    selectors.getFirstBreakpointPosition(state, location)
  ),
}))(LineNumberPortal);
