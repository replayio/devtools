import classNames from "classnames";
import ReactDOM from "react-dom";

import React, { useRef, useState, useEffect, ReactChild, ReactNode } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import ReplayLogo from "ui/components/shared/ReplayLogo";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";
import { shouldShowNag } from "ui/utils/user";
const { prefs } = require("ui/utils/prefs");

const { runAnalysisOnLine } = require("devtools/client/debugger/src/actions/breakpoints/index");
const {
  updateHoveredLineNumber,
} = require("devtools/client/debugger/src/actions/breakpoints/index");

type LineNumberTooltipProps = PropsFromRedux & { editor: any };

function LineNumberTooltip({ editor }: LineNumberTooltipProps) {
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
    console.log({ targetNode });
    setLineNumberNode(targetNode);
  };
  const onLineLeave = () => {
    setLineNumberNode(null);
    setHoveredLineNumber(null);
  };

  useEffect(() => {
    editor.codeMirror.on("lineMouseEnter", onLineEnter);
    editor.codeMirror.on("lineMouseLeave", onLineLeave);
    return () => {
      editor.codeMirror.off("lineMouseEnter", onLineEnter);
      editor.codeMirror.off("lineMouseLeave", onLineLeave);
    };
  }, []);

  console.log("a123");
  if (!lineNumberNode) {
    return null;
  }
  console.log("b123");

  const { top, left, right, height, width } = lineNumberNode.getBoundingClientRect();
  const style = {
    top: `${top + (1 / 2) * height}px`,
    left: `${right + (1 / 2) * width}px`,
    marginLeft: `8px`,
  };

  console.log(">>>b123");
  return ReactDOM.createPortal(
    <div className={`bg-blue-500 p-2 absolute z-50 rounded-md text-white`} style={style}>
      +
    </div>,
    document.body
  );

  return (
    <StaticTooltip targetNode={lineNumberNode}>
      <>
        {isHot ? <MaterialIcon className="mr-1">warning_amber</MaterialIcon> : null}
        <span>{`${points} hit${points == 1 ? "" : "s"}`}</span>
      </>
    </StaticTooltip>
  );
}

const connector = connect(
  (state: UIState) => ({
    indexed: selectors.getIndexed(state),
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
