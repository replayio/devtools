import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import "./LineNumberTooltip.css";

export function StaticTooltip({ targetNode, children }) {
  const { top, left } = targetNode.getBoundingClientRect();
  const docWidth = document.querySelector("html").getBoundingClientRect().width;

  return ReactDOM.createPortal(
    <div className="static-tooltip" style={{ top: `${top}px`, right: `${docWidth - left}px` }}>
      {children}
    </div>,
    targetNode
  );
}

export function LineNumberTooltip({
  editor,
  cx,
  runAnalysisOnLine,
  analysisPoints,
  setHoveredLineNumberLocation,
}) {
  const [lineNumberNode, setLineNumberNode] = useState(null);

  const setHoveredLineNumber = ({ targetNode, lineNumber }) => {
    setLineNumberNode(targetNode);
    runAnalysisOnLine(cx, lineNumber);
  };
  const clearHoveredLineNumber = () => {
    setLineNumberNode(null);
    setHoveredLineNumberLocation(null);
  };

  useEffect(() => {
    editor.codeMirror.on("gutterLineEnter", setHoveredLineNumber);
    editor.codeMirror.on("gutterLineLeave", clearHoveredLineNumber);
  }, []);

  if (!lineNumberNode || !analysisPoints) {
    return null;
  }

  return (
    <StaticTooltip targetNode={lineNumberNode}>
      {`${analysisPoints.length} hit${analysisPoints.length == 1 ? "" : "s"}`}
    </StaticTooltip>
  );
}

export default connect(
  state => ({
    cx: selectors.getThreadContext(state),
    analysisPoints: selectors.getPointsForHoveredLineNumber(state),
  }),
  {
    runAnalysisOnLine: actions.runAnalysisOnLine,
    setHoveredLineNumberLocation: actions.setHoveredLineNumberLocation,
  }
)(LineNumberTooltip);
