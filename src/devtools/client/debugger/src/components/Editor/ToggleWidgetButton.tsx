import ReactDOM from "react-dom";
import React, { useState, useEffect, MouseEventHandler } from "react";
import { connect, ConnectedProps, useSelector } from "react-redux";
import { actions } from "ui/actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { Breakpoint, getBreakpointsForSource } from "../../reducers/breakpoints";
import { getSelectedSource } from "../../reducers/sources";
import classNames from "classnames";
import { toggleLogpoint } from "../../actions/breakpoints/logpoints";
import hooks from "ui/hooks";
import { shouldShowNag } from "ui/utils/user";
import { Nag } from "ui/hooks/users";
import { AWESOME_BACKGROUND } from "./LineNumberTooltip";
import { KeyModifiers, KeyModifiersContext } from "ui/components/KeyModifiers";

const { runAnalysisOnLine } = require("devtools/client/debugger/src/actions/breakpoints/index");
const {
  updateHoveredLineNumber,
} = require("devtools/client/debugger/src/actions/breakpoints/index");

function ToggleButton({
  onClick,
  onMouseDown,
  keyModifiers,
  targetNode,
  breakpoint,
}: {
  onClick: MouseEventHandler;
  onMouseDown: MouseEventHandler;
  keyModifiers: KeyModifiers;
  targetNode: HTMLElement;
  breakpoint?: Breakpoint;
}) {
  const isMetaActive = keyModifiers.meta;
  const isShiftActive = keyModifiers.shift;
  const { nags } = hooks.useGetUserInfo();
  const showNag = shouldShowNag(nags, Nag.FIRST_BREAKPOINT_ADD);

  const icon = breakpoint?.options.logValue ? "remove" : "add";
  const { height } = targetNode.getBoundingClientRect();
  const style = {
    background: showNag ? AWESOME_BACKGROUND : "",
  };

  let button;

  if (isMetaActive && isShiftActive) {
    button = (
      <button
        className={classNames(
          "toggle-widget bg-primaryAccent",
          "flex rounded-md p-px leading-3 text-white shadow-lg transition hover:scale-125"
        )}
        style={style}
      >
        <MaterialIcon>navigate_before</MaterialIcon>
      </button>
    );
  } else if (isMetaActive) {
    button = (
      <button
        className={classNames(
          "toggle-widget bg-primaryAccent",
          "flex rounded-md p-px leading-3 text-white shadow-lg transition hover:scale-125"
        )}
        style={style}
      >
        <MaterialIcon>navigate_next</MaterialIcon>
      </button>
    );
  } else {
    button = (
      <button
        className={classNames(
          "toggle-widget bg-primaryAccent",
          "flex rounded-md p-px leading-3 text-white shadow-lg transition hover:scale-125"
        )}
        style={style}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        <MaterialIcon>{icon}</MaterialIcon>
      </button>
    );
  }

  return (
    <div
      className="absolute z-50 flex flex-row space-x-px transform -translate-y-1/2"
      style={{ top: `${(1 / 2) * height}px` }}
    >
      {button}
    </div>
  );
}

type ToggleWidgetButtonProps = PropsFromRedux & { editor: any };

function ToggleWidgetButton({ editor, toggleLogpoint, cx, breakpoints }: ToggleWidgetButtonProps) {
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

    toggleLogpoint(cx, hoveredLineNumber, bp);
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

  return ReactDOM.createPortal(
    <KeyModifiersContext.Consumer>
      {keyModifiers => (
        <ToggleButton
          onClick={onClick}
          onMouseDown={onMouseDown}
          targetNode={targetNode}
          breakpoint={bp}
          keyModifiers={keyModifiers}
        />
      )}
    </KeyModifiersContext.Consumer>,
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
    toggleLogpoint,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ToggleWidgetButton);
