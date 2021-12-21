import ReactDOM from "react-dom";
import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { getBreakpointsForSource } from "../../reducers/breakpoints";
import { getSelectedSource } from "../../reducers/sources";
import classNames from "classnames";
import { togglePrintStatement } from "../../actions/breakpoints/print-statements";

const { runAnalysisOnLine } = require("devtools/client/debugger/src/actions/breakpoints/index");
const {
  updateHoveredLineNumber,
} = require("devtools/client/debugger/src/actions/breakpoints/index");

type ShowWidgetButtonProps = PropsFromRedux & { editor: any };

function ShowWidgetButton({
  editor,
  togglePrintStatement,
  cx,
  breakpoints,
}: ShowWidgetButtonProps) {
  const [targetNode, setTargetNode] = useState<HTMLElement | null>(null);
  const [hoveredLineNumber, setHoveredLineNumber] = useState<number | null>(null);

  const onLineEnter = ({ lineNode, lineNumber }: { lineNode: HTMLElement; lineNumber: number }) => {
    setHoveredLineNumber(lineNumber);
    setTargetNode(lineNode);
  };
  const onLineLeave = () => {
    setTargetNode(null);
    setHoveredLineNumber(null);
  };
  const bp = breakpoints.find((b: any) => b.location.line === hoveredLineNumber);
  const onMouseDown = (e: React.MouseEvent) => {
    // This keeps the cursor in CodeMirror from moving after clicking on the button.
    e.stopPropagation();
  };
  const onClick = () => {
    if (!hoveredLineNumber) {
      return;
    }

    togglePrintStatement(cx, hoveredLineNumber, bp);
  };

  useEffect(() => {
    editor.codeMirror.on("lineMouseEnter", onLineEnter);
    editor.codeMirror.on("lineMouseLeave", onLineLeave);
    return () => {
      editor.codeMirror.off("lineMouseEnter", onLineEnter);
      editor.codeMirror.off("lineMouseLeave", onLineLeave);
    };
  }, []);

  if (!targetNode) {
    return null;
  }

  const { height } = targetNode.getBoundingClientRect();
  const style = {
    top: `${(1 / 2) * height}px`,
  };

  return ReactDOM.createPortal(
    <button
      className={classNames(
        "bg-primaryAccent",
        "flex p-px absolute z-50 rounded-md text-white transform -translate-y-1/2 leading-3 transition hover:scale-125 shadow-lg"
      )}
      style={style}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <MaterialIcon>{bp?.options.logValue ? "remove" : "add"}</MaterialIcon>
    </button>,
    targetNode
  );
}

const connector = connect(
  (state: UIState) => ({
    indexed: selectors.getIndexed(state),
    analysisPoints: selectors.getPointsForHoveredLineNumber(state),
    cx: selectors.getThreadContext(state),
    breakpoints: getBreakpointsForSource(state, getSelectedSource(state).id),
  }),
  {
    runAnalysisOnLine: runAnalysisOnLine,
    setHoveredLineNumberLocation: actions.setHoveredLineNumberLocation,
    updateHoveredLineNumber: updateHoveredLineNumber,
    togglePrintStatement,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShowWidgetButton);
