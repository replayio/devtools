import ReactDOM from "react-dom";
import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { addBreakpointAtLine } from "../../actions/breakpoints";
import { getBreakpointsForSource } from "../../reducers/breakpoints";
import { getSelectedSource } from "../../reducers/sources";
import { removeBreakpoint } from "../../actions/breakpoints/modify";
import classNames from "classnames";
import { trackEvent } from "ui/utils/telemetry";

const { runAnalysisOnLine } = require("devtools/client/debugger/src/actions/breakpoints/index");
const {
  updateHoveredLineNumber,
} = require("devtools/client/debugger/src/actions/breakpoints/index");

type ShowWidgetButtonProps = PropsFromRedux & { editor: any };

function ShowWidgetButton({
  editor,
  addBreakpointAtLine,
  cx,
  breakpoints,
  removeBreakpoint,
}: ShowWidgetButtonProps) {
  const [lineNumberNode, setLineNumberNode] = useState<HTMLElement | null>(null);
  const [hoveredLineNumber, setHoveredLineNumber] = useState<number | null>(null);

  const onLineEnter = ({
    lineNumberNode: targetNode,
    lineNumber,
  }: {
    lineNumberNode: HTMLElement;
    lineNumber: number;
  }) => {
    setHoveredLineNumber(lineNumber);
    setLineNumberNode(targetNode);
  };
  const onLineLeave = () => {
    setLineNumberNode(null);
    setHoveredLineNumber(null);
  };
  const bp = breakpoints.find((b: any) => b.location.line === hoveredLineNumber);
  const onClick = (event: React.MouseEvent) => {
    if (!hoveredLineNumber) {
      return;
    }

    if (bp?.options.logValue) {
      trackEvent("breakpoint.minus_click");
      return removeBreakpoint(cx, bp);
    }

    trackEvent("breakpoint.plus_click");
    return addBreakpointAtLine(cx, hoveredLineNumber, true, event.shiftKey);
  };

  useEffect(() => {
    editor.codeMirror.on("lineMouseEnter", onLineEnter);
    editor.codeMirror.on("lineMouseLeave", onLineLeave);
    return () => {
      editor.codeMirror.off("lineMouseEnter", onLineEnter);
      editor.codeMirror.off("lineMouseLeave", onLineLeave);
    };
  }, []);

  if (!lineNumberNode) {
    return null;
  }

  const { height, width } = lineNumberNode.getBoundingClientRect();
  const style = {
    top: `${(1 / 2) * height}px`,
    left: `${width}px`,
  };

  return ReactDOM.createPortal(
    <button
      className={classNames(
        "bg-primaryAccent",
        "flex p-px absolute z-50 rounded-md text-white transform -translate-y-1/2 leading-3 hover:scale-110 ml-1"
      )}
      style={style}
      onClick={onClick}
    >
      <MaterialIcon>{bp?.options.logValue ? "remove" : "add"}</MaterialIcon>
    </button>,
    lineNumberNode.parentElement!
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
    addBreakpointAtLine: addBreakpointAtLine,
    removeBreakpoint: removeBreakpoint,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShowWidgetButton);
