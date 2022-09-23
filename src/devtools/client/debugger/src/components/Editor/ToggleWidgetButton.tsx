import { PointDescription } from "@replayio/protocol";
import ReactDOM from "react-dom";
import React, { useState, useEffect, MouseEventHandler, FC, ReactNode, Suspense } from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { Breakpoint, getBreakpointsForSelectedSource } from "../../reducers/breakpoints";
import classNames from "classnames";
import { toggleLogpoint } from "../../actions/breakpoints/logpoints";
import hooks from "ui/hooks";
import { shouldShowNag } from "ui/utils/user";
import { Nag } from "ui/hooks/users";
import { AWESOME_BACKGROUND } from "./LineNumberTooltip";
import { KeyModifiers, KeyModifiersContext } from "ui/components/KeyModifiers";
import findLast from "lodash/findLast";
import { compareNumericStrings } from "protocol/utils";
import { getExecutionPoint } from "../../reducers/pause";
import { seek } from "ui/actions/timeline";
import { useFeature, useStringPref } from "ui/hooks/settings";
import useHitPointsForHoveredLocation from "ui/hooks/useHitPointsForHoveredLocation";

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
        "flex rounded-md p-px leading-3 text-buttontextColor shadow-lg transition hover:scale-125",
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
  onMouseDown,
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
  const isMetaActive = keyModifiers.meta;
  const isShiftActive = keyModifiers.shift;
  const dispatch = useAppDispatch();
  const executionPoint = useAppSelector(getExecutionPoint);
  const { nags } = hooks.useGetUserInfo();
  const showNag = shouldShowNag(nags, Nag.FIRST_BREAKPOINT_ADD);
  const { height } = targetNode.getBoundingClientRect();
  const { value: enableLargeText } = useFeature("enableLargeText");

  const [hitPoints, hitPointStatus] = useHitPointsForHoveredLocation();

  const onAddLogpoint = () => {
    dispatch(toggleLogpoint(cx, hoveredLineNumber, breakpoint));
  };

  let next: PointDescription | undefined, prev: PointDescription | undefined;

  const error = hitPointStatus === "too-many-points-to-find";

  if (hitPoints && !error && executionPoint) {
    prev = findLast(hitPoints, p => compareNumericStrings(p.point, executionPoint) < 0);
    next = hitPoints.find(p => compareNumericStrings(p.point, executionPoint) > 0);
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

  if (hitPoints && isMetaActive && isShiftActive) {
    button = (
      <ContinueToPrevious showNag={showNag} onClick={onContinueToPrevious} disabled={!prev} />
    );
  } else if (hitPoints && isMetaActive) {
    button = <ContinueToNext showNag={showNag} onClick={onContinueToNext} disabled={!next} />;
  } else {
    button = <AddLogpoint breakpoint={breakpoint} showNag={showNag} onClick={onAddLogpoint} />;
  }

  return (
    <div
      className={classNames(
        "line-action-button absolute z-50 flex translate-x-full transform flex-row space-x-px",
        enableLargeText && "bottom-0.5"
      )}
      // This is necessary so that we don't move the CodeMirror cursor while clicking.
      onMouseDown={onMouseDown}
      style={{
        top: `-${(1 / 2) * (18 - height)}px`,
        right: "var(--print-statement-right-offset)",
      }}
    >
      {button}
    </div>
  );
}

type ExternalProps = { editor: any };
type ToggleWidgetButtonProps = PropsFromRedux & ExternalProps;

function ToggleWidgetButton({ editor, cx, breakpoints }: ToggleWidgetButtonProps) {
  const [targetNode, setTargetNode] = useState<HTMLElement | null>(null);
  const [hoveredLineNumber, setHoveredLineNumber] = useState<number | null>(null);

  const bp = breakpoints.find((b: any) => b.location.line === hoveredLineNumber);
  const onMouseDown = (e: React.MouseEvent) => {
    // This keeps the cursor in CodeMirror from moving after clicking on the button.
    e.stopPropagation();
  };

  useEffect(() => {
    const onLineEnter = ({
      lineNumberNode,
      lineNumber,
    }: {
      lineNumberNode: HTMLElement;
      lineNumber: number;
    }) => {
      setHoveredLineNumber(lineNumber);
      setTargetNode(lineNumberNode);
    };
    const onLineLeave = () => {
      setTargetNode(null);
      setHoveredLineNumber(null);
    };

    editor.codeMirror.on("lineMouseEnter", onLineEnter);
    editor.codeMirror.on("lineMouseLeave", onLineLeave);
    return () => {
      editor.codeMirror.off("lineMouseEnter", onLineEnter);
      editor.codeMirror.off("lineMouseLeave", onLineLeave);
    };
  }, [editor]);

  if (!targetNode || !hoveredLineNumber) {
    console.log(`hoveredLineNumber (bail)`, hoveredLineNumber);
    return null;
  }
  console.log(`hoveredLineNumber`, hoveredLineNumber);
  return ReactDOM.createPortal(
    <KeyModifiersContext.Consumer>
      {keyModifiers => (
        <QuickActions
          hoveredLineNumber={hoveredLineNumber}
          onMouseDown={onMouseDown}
          targetNode={targetNode}
          breakpoint={bp}
          cx={cx}
          keyModifiers={keyModifiers}
        />
      )}
    </KeyModifiersContext.Consumer>,
    targetNode
  );
}

const connector = connect(
  (state: UIState) => ({
    cx: selectors.getThreadContext(state),
    breakpoints: getBreakpointsForSelectedSource(state),
  }),
  {}
);
type PropsFromRedux = ConnectedProps<typeof connector>;
const ConnectedToggleWidgetButton = connector(ToggleWidgetButton);

export default function ToggleWidgetButtonSuspenseWrapper(props: ExternalProps) {
  return (
    <Suspense fallback={null}>
      <ConnectedToggleWidgetButton {...props} />
    </Suspense>
  );
}
