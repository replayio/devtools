import React, { useRef, useState, useEffect } from "react";
import { connect } from "../../utils/connect";

import ReactDOM from "react-dom";
import "./LineNumberPortal.css";
import { selectors } from "ui/reducers";

function LineNumberPortal({ targetNode, analysisPoints }) {
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

  if (!ready || !targetNode || !analysisPoints) {
    return null;
  }

  return ReactDOM.createPortal(
    <LineNumberTooltip targetNode={targetNode} hits={analysisPoints.length} />,
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

// Move this to an action JV
const mapStateToProps = state => {
  const lineNumber = selectors.getHoveredLineNumber(state);

  if (!lineNumber) {
    return { analysisPoints: null };
  }

  return {
    analysisPoints: selectors.getAnalysisPointsForLocation(
      state,
      selectors.getFirstBreakpointPosition(state, lineNumber)
    ),
  };
};

export default connect(mapStateToProps)(LineNumberPortal);
