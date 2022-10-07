import { PointDescription } from "@replayio/protocol";
import ReactDOM from "react-dom";
import React, { useState, useEffect, MouseEventHandler, FC, ReactNode, Suspense } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import MaterialIcon from "ui/components/shared/MaterialIcon";
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
import { getExecutionPoint, getThreadContext } from "../../reducers/pause";
import { seek } from "ui/actions/timeline";
import { useFeature } from "ui/hooks/settings";
import useHitPointsForHoveredLocation from "ui/hooks/useHitPointsForHoveredLocation";
import SourceEditor from "../../utils/editor/source-editor";

const QuickActionButton: FC<{
  children: ReactNode;
  dataTestId?: string;
  disabled?: boolean;
  onClick: () => void;
  showNag: boolean;
}> = ({ children, dataTestId, disabled, onClick, showNag }) => {
  return (
    <button
      className={classNames(
        "toggle-widget",
        "flex rounded-md p-px leading-3 text-buttontextColor shadow-lg transition hover:scale-125",
        `${disabled ? "bg-gray-600" : "bg-primaryAccent"}`
      )}
      data-test-id={dataTestId}
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
  <QuickActionButton
    dataTestId="ContinueToPreviousButton"
    showNag={showNag}
    onClick={onClick}
    disabled={disabled}
  >
    <MaterialIcon>navigate_before</MaterialIcon>
  </QuickActionButton>
);
const ContinueToNext: FC<{ showNag: boolean; onClick: () => void; disabled: boolean }> = ({
  showNag,
  onClick,
  disabled,
}) => (
  <QuickActionButton
    dataTestId="ContinueToNextButton"
    showNag={showNag}
    onClick={onClick}
    disabled={disabled}
  >
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
    <QuickActionButton dataTestId="ToggleLogpointButton" showNag={showNag} onClick={onClick}>
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
  const [height, setHeight] = useState(18);
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() =>
      setHeight(targetNode.getBoundingClientRect().height)
    );

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetNode]);

  const isMetaActive = keyModifiers.meta;
  const isShiftActive = keyModifiers.shift;
  const dispatch = useAppDispatch();
  const executionPoint = useAppSelector(getExecutionPoint);
  const { nags } = hooks.useGetUserInfo();
  const showNag = shouldShowNag(nags, Nag.FIRST_BREAKPOINT_ADD);
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

type Props = { editor: SourceEditor | null };

function ToggleWidgetButton({ editor }: Props) {
  const cx = useAppSelector(getThreadContext);
  const breakpoints = useAppSelector(getBreakpointsForSelectedSource);

  const [targetNode, setTargetNode] = useState<HTMLElement | null>(null);
  const [hoveredLineNumber, setHoveredLineNumber] = useState<number | null>(null);

  const bp = breakpoints.find((b: any) => b.location.line === hoveredLineNumber);
  const onMouseDown = (e: React.MouseEvent) => {
    // This keeps the cursor in CodeMirror from moving after clicking on the button.
    e.stopPropagation();
  };

  useEffect(() => {
    if (editor == null) {
      return;
    }

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

    // @ts-expect-error Custom event type
    editor.codeMirror.on("lineMouseEnter", onLineEnter);
    // @ts-expect-error Custom event type
    editor.codeMirror.on("lineMouseLeave", onLineLeave);
    return () => {
      // @ts-expect-error Custom event type
      editor.codeMirror.off("lineMouseEnter", onLineEnter);
      // @ts-expect-error Custom event type
      editor.codeMirror.off("lineMouseLeave", onLineLeave);
    };
  }, [editor]);

  if (!targetNode || !hoveredLineNumber) {
    return null;
  }

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

export default function ToggleWidgetButtonSuspenseWrapper(props: Props) {
  return (
    <Suspense fallback={null}>
      <ToggleWidgetButton {...props} />
    </Suspense>
  );
}
