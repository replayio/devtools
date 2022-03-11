import ReactDOM from "react-dom";
import React, { useState, useEffect, MouseEventHandler, FC, ReactNode } from "react";
import { connect, ConnectedProps, useDispatch, useSelector } from "react-redux";
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
import findLast from "lodash/findLast";
import find from "lodash/find";
import { getPointsForHoveredLineNumber } from "ui/reducers/app";
import { compareNumericStrings } from "protocol/utils";
import { getExecutionPoint } from "../../reducers/pause";
import { PointDescription } from "@recordreplay/protocol";
import { seek } from "ui/actions/timeline";
import { KeyModifiers, useKeyModifiers } from "./useKeyModifiers";

const { runAnalysisOnLine } = require("devtools/client/debugger/src/actions/breakpoints/index");
const {
  updateHoveredLineNumber,
} = require("devtools/client/debugger/src/actions/breakpoints/index");

const QuickActionButton: FC<{
  showNag: boolean;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}> = ({ showNag, disabled, children, onClick }) => {
  return (
    <button
      className={classNames(
        "toggle-widget",
        "flex rounded-md p-px leading-3 text-white shadow-lg transition hover:scale-125",
        `${disabled ? "bg-gray-600" : "bg-primaryAccent"}`
      )}
      onClick={disabled ? () => {} : onClick}
      style={{ background: showNag ? AWESOME_BACKGROUND : "" }}
    >
      {children}
    </button>
  );
};

const ContinueToPrevious: FC<{ showNag: boolean; onClick: () => void; disabled: boolean }> = ({
  showNag,
  onClick,
  disabled,
}) => (
  <QuickActionButton showNag={showNag} onClick={onClick} disabled={disabled}>
    <MaterialIcon>navigate_before</MaterialIcon>
  </QuickActionButton>
);
const ContinueToNext: FC<{ showNag: boolean; onClick: () => void; disabled: boolean }> = ({
  showNag,
  onClick,
  disabled,
}) => (
  <QuickActionButton showNag={showNag} onClick={onClick} disabled={disabled}>
    <MaterialIcon>navigate_next</MaterialIcon>
  </QuickActionButton>
);
const AddLogpoint: FC<{ showNag: boolean; onClick: () => void; breakpoint?: Breakpoint }> = ({
  showNag,
  onClick,
  breakpoint,
}) => {
  const icon = breakpoint?.options.logValue ? "remove" : "add";

  return (
    <QuickActionButton showNag={showNag} onClick={onClick}>
      <MaterialIcon>{icon}</MaterialIcon>
    </QuickActionButton>
  );
};

function QuickActions({
  hoveredLineNumber,
  keyModifiers,
  targetNode,
  breakpoint,
  cx,
}: {
  hoveredLineNumber: number;
  onMouseDown: MouseEventHandler;
  keyModifiers: KeyModifiers;
  targetNode: HTMLElement;
  breakpoint?: Breakpoint;
  cx: any;
}) {
  const dispatch = useDispatch();
  const analysisPoints = useSelector(getPointsForHoveredLineNumber);
  const executionPoint = useSelector(getExecutionPoint);
  const { nags } = hooks.useGetUserInfo();
  const showNag = shouldShowNag(nags, Nag.FIRST_BREAKPOINT_ADD);
  const { height } = targetNode.getBoundingClientRect();

  const onAddLogpoint = () => {
    dispatch(toggleLogpoint(cx, hoveredLineNumber, breakpoint));
  };

  let prev: PointDescription | undefined, next: PointDescription | undefined;

  if (analysisPoints && analysisPoints !== "error" && executionPoint) {
    prev = findLast(analysisPoints, p => compareNumericStrings(p.point, executionPoint) < 0);
    next = find(analysisPoints, p => compareNumericStrings(p.point, executionPoint) > 0);
  }

  const onContinueToNext = () => {
    if (next) {
      dispatch(seek(next.point, next.time, true));
    }
  };
  const onContinueToPrevious = () => {
    if (prev) {
      dispatch(seek(prev.point, prev.time, true));
    }
  };

  let button;

  if (keyModifiers.meta && keyModifiers.shift) {
    button = (
      <ContinueToPrevious showNag={showNag} onClick={onContinueToPrevious} disabled={!prev} />
    );
  } else if (keyModifiers.meta) {
    button = <ContinueToNext showNag={showNag} onClick={onContinueToNext} disabled={!next} />;
  } else {
    button = <AddLogpoint breakpoint={breakpoint} showNag={showNag} onClick={onAddLogpoint} />;
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

function ToggleWidgetButton({ editor, cx, breakpoints }: ToggleWidgetButtonProps) {
  const [targetNode, setTargetNode] = useState<HTMLElement | null>(null);
  const [hoveredLineNumber, setHoveredLineNumber] = useState<number | null>(null);
  const { keyModifiers, updateKeyModifiers, resetKeyModifiers } = useKeyModifiers();

  const onLineEnter = ({
    lineNode,
    lineNumber,
    event,
  }: {
    lineNode: HTMLElement;
    lineNumber: number;
    event: KeyboardEvent;
  }) => {
    setHoveredLineNumber(lineNumber);
    setTargetNode(lineNode);

    updateKeyModifiers({
      shift: event.shiftKey,
      meta: event.metaKey,
    });
  };
  const onLineLeave = () => {
    setTargetNode(null);
    resetKeyModifiers();
    setHoveredLineNumber(null);
  };
  const bp = breakpoints.find((b: any) => b.location.line === hoveredLineNumber);
  const onMouseDown = (e: React.MouseEvent) => {
    // This keeps the cursor in CodeMirror from moving after clicking on the button.
    e.stopPropagation();
  };
  useEffect(() => {
    editor.codeMirror.on("lineMouseEnter", onLineEnter);
    editor.codeMirror.on("lineMouseLeave", onLineLeave);
    return () => {
      editor.codeMirror.off("lineMouseEnter", onLineEnter);
      editor.codeMirror.off("lineMouseLeave", onLineLeave);
    };
  }, []);

  if (!targetNode || !hoveredLineNumber) {
    return null;
  }

  return ReactDOM.createPortal(
    <QuickActions
      hoveredLineNumber={hoveredLineNumber}
      onMouseDown={onMouseDown}
      targetNode={targetNode}
      breakpoint={bp}
      cx={cx}
      keyModifiers={keyModifiers}
    />,
    targetNode
  );
}

const connector = connect(
  (state: UIState) => ({
    indexed: selectors.getIndexed(state),
    cx: selectors.getThreadContext(state),
    breakpoints: getBreakpointsForSource(state, getSelectedSource(state).id),
  }),
  {
    runAnalysisOnLine: runAnalysisOnLine,
    setHoveredLineNumberLocation: actions.setHoveredLineNumberLocation,
    updateHoveredLineNumber: updateHoveredLineNumber,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ToggleWidgetButton);
