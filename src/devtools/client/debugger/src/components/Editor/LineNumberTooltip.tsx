import classNames from "classnames";
import React, { useRef, useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import ReplayLogo from "ui/components/shared/ReplayLogo";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";
const { prefs } = require("ui/utils/prefs");

import StaticTooltip from "./StaticTooltip";

const { runAnalysisOnLine } = require("devtools/client/debugger/src/actions/breakpoints/index");
const {
  updateHoveredLineNumber,
} = require("devtools/client/debugger/src/actions/breakpoints/index");

type LineNumberTooltipProps = PropsFromRedux & { editor: any };

function LineNumberTooltip({
  editor,
  indexed,
  runAnalysisOnLine,
  analysisPoints,
  setHoveredLineNumberLocation,
  updateHoveredLineNumber,
}: LineNumberTooltipProps) {
  const { nags } = hooks.useGetUserInfo();
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
          runAnalysisOnLine(lineNumber);
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

  useEffect(() => {
    if (analysisPoints)
      trackEvent(
        analysisPoints.length ? "breakpoint.preview_has_hits" : "breakpoint.preview_no_hits"
      );
  }, [analysisPoints]);

  if (!lineNumberNode) {
    return null;
  }

  if (!indexed) {
    return <StaticTooltip targetNode={lineNumberNode}>Indexing</StaticTooltip>;
  }

  // Show a loading state immediately while we wait for the analysis points
  // to be generated.
  if (!analysisPoints) {
    return <StaticTooltip targetNode={lineNumberNode}>Loading…</StaticTooltip>;
  }

  if (analysisPoints === "error") {
    return <StaticTooltip targetNode={lineNumberNode}>Failed</StaticTooltip>;
  }

  const points = analysisPoints.length;
  const isHot = points > prefs.maxHitsDisplayed;
  const showNag = nags && !nags.includes(Nag.FIRST_BREAKPOINT_ADD);

  return (
    <StaticTooltip
      targetNode={lineNumberNode}
      className={classNames({ hot: isHot, "nag-tooltip": showNag })}
    >
      {showNag ? (
        <AwesomeTooltip isHot={isHot} points={points} />
      ) : (
        <>
          {isHot ? <MaterialIcon className="mr-1">warning_amber</MaterialIcon> : null}
          <span>{`${points} hit${points == 1 ? "" : "s"}`}</span>
        </>
      )}
    </StaticTooltip>
  );
}

function AwesomeTooltip({ points }: { isHot: boolean; points: number }) {
  return (
    <div
      className="bg-secondaryAccent text-white py-1 px-2 flex space-x-2 items-center leading-tight rounded-md text-left"
      style={{
        background:
          "linear-gradient(116.71deg, #FF2F86 21.74%, #EC275D 83.58%), linear-gradient(133.71deg, #01ACFD 3.31%, #F155FF 106.39%, #F477F8 157.93%, #F33685 212.38%), #007AFF",
      }}
    >
      <MaterialIcon iconSize="xl">auto_awesome</MaterialIcon>
      <div className="text-xs flex flex-col">
        <div>{`This line was hit ${points} time${points == 1 ? "" : "s"}`}</div>
        <div className="font-bold">Click to add a print statement</div>
      </div>
    </div>
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
