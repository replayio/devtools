import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
const { prefs } = require("ui/utils/prefs");
import "./LineNumberTooltip.css";

const { runAnalysisOnLine } = require("devtools/client/debugger/src/actions/breakpoints/index");
const {
  updateHoveredLineNumber,
} = require("devtools/client/debugger/src/actions/breakpoints/index");
const { getThreadContext } = require("devtools/client/debugger/src/reducers/pause");

type StaticTooltipProps = {
  targetNode: HTMLElement;
  children: JSX.Element | string;
  className?: string;
};

export function StaticTooltip({ targetNode, children, className }: StaticTooltipProps) {
  const { top, left } = targetNode.getBoundingClientRect();
  const docWidth = document.querySelector("html")!.getBoundingClientRect().width;

  return ReactDOM.createPortal(
    <div
      className={`static-tooltip ${className}`}
      style={{ top: `${top}px`, right: `${docWidth - left}px` }}
    >
      {children}
    </div>,
    targetNode
  );
}

type LineNumberTooltipProps = PropsFromRedux & { editor: any };

function LineNumberTooltip({
  editor,
  cx,
  runAnalysisOnLine,
  analysisPoints,
  setHoveredLineNumberLocation,
  updateHoveredLineNumber,
}: LineNumberTooltipProps) {
  const [lineNumberNode, setLineNumberNode] = useState<HTMLElement | null>(null);
  const lastHoveredLineNumber = useRef<number | null>(null);

  const setHoveredLineNumber = ({
    targetNode,
    lineNumber,
  }: {
    targetNode: HTMLElement;
    lineNumber: number;
  }) => {
    // The gutter re-renders when we click the line number to add
    // a breakpoint. That triggers a second gutterLineEnter event
    // for the same line number. In that case, we shouldn't run
    // the analysis again.
    if (lineNumber !== lastHoveredLineNumber.current) {
      lastHoveredLineNumber.current = lineNumber;
      setTimeout(() => {
        if (lineNumber === lastHoveredLineNumber.current) {
          runAnalysisOnLine(cx, lineNumber);
        }
      }, 100);
    }

    updateHoveredLineNumber(lineNumber);
    setLineNumberNode(targetNode);
  };
  const clearHoveredLineNumber = () => {
    setLineNumberNode(null);
    setHoveredLineNumberLocation(null);
  };

  useEffect(() => {
    editor.codeMirror.on("gutterLineEnter", setHoveredLineNumber);
    editor.codeMirror.on("gutterLineLeave", clearHoveredLineNumber);
    return () => {
      editor.codeMirror.off("gutterLineEnter", setHoveredLineNumber);
      editor.codeMirror.off("gutterLineLeave", clearHoveredLineNumber);
    };
  }, []);

  if (!lineNumberNode) {
    return null;
  }

  // Show a loading state immediately while we wait for the analysis points
  // to be generated.
  if (!analysisPoints) {
    return <StaticTooltip targetNode={lineNumberNode}>...</StaticTooltip>;
  }

  if (analysisPoints === "error") {
    return <StaticTooltip targetNode={lineNumberNode}>Failed</StaticTooltip>;
  }

  const points = analysisPoints.length;
  const isHot = points > prefs.maxHitsDisplayed;

  return (
    <StaticTooltip targetNode={lineNumberNode} className={isHot ? "hot" : ""}>
      <>
        {isHot && <MaterialIcon>warning_amber</MaterialIcon>}
        <span>{`${points} hit${points == 1 ? "" : "s"}`}</span>
      </>
    </StaticTooltip>
  );
}

const connector = connect(
  (state: UIState) => ({
    cx: getThreadContext(state),
    analysisPoints: selectors.getPointsForHoveredLineNumber(state),
  }),
  {
    runAnalysisOnLine: runAnalysisOnLine,
    setHoveredLineNumberLocation: actions.setHoveredLineNumberLocation,
    updateHoveredLineNumber: updateHoveredLineNumber,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(LineNumberTooltip);
