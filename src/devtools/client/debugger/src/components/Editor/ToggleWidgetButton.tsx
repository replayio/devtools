import { PointDescription } from "@replayio/protocol";
import React, { useEffect, FC, ReactNode, Suspense, useRef, useCallback } from "react";
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
import { useFeature } from "ui/hooks/settings";
import useHitPointsForHoveredLocation from "ui/hooks/useHitPointsForHoveredLocation";
import type { SourceEditor } from "../../utils/editor/source-editor";

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
  breakpoint,
  keyModifiers,
  onAddLogpoint,
}: {
  breakpoint?: Breakpoint;
  keyModifiers: KeyModifiers;
  onAddLogpoint: () => void;
}) {
  const isMetaActive = keyModifiers.meta;
  const isShiftActive = keyModifiers.shift;
  const dispatch = useAppDispatch();
  const executionPoint = useAppSelector(getExecutionPoint);
  const { nags } = hooks.useGetUserInfo();
  const showNag = shouldShowNag(nags, Nag.FIRST_BREAKPOINT_ADD);
  // const { value: enableLargeText } = useFeature("enableLargeText");

  const [hitPoints, hitPointStatus] = useHitPointsForHoveredLocation();

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
      id="add-print-statement"
      style={{ position: "absolute", top: 0, right: "var(--print-statement-right-offset)" }}
    >
      {button}
    </div>
  );
}

type ExternalProps = { sourceEditor: SourceEditor };
type ToggleWidgetButtonProps = PropsFromRedux & ExternalProps;

function ToggleWidgetButton({ sourceEditor, cx, breakpoints }: ToggleWidgetButtonProps) {
  const dispatch = useAppDispatch();
  const hoveredLineNumber = useRef<number | null>(null);
  const getBreakpoint = useCallback(() => {
    return breakpoints.find(
      (breakpoint: any) => breakpoint.location.line === hoveredLineNumber.current
    );
  }, [breakpoints]);
  const onAddLogpoint = () => {
    if (hoveredLineNumber.current !== null) {
      const breakpoint = getBreakpoint();
      dispatch(toggleLogpoint(cx, hoveredLineNumber.current, breakpoint));
    }
  };

  useEffect(() => {
    const addPrintStatementElement = document.getElementById("add-print-statement");
    const onLineEnter = ({ lineNumber }: { lineNumber: number }) => {
      const lineOffsetTop =
        sourceEditor.editor.heightAtLine(lineNumber) - (addPrintStatementElement?.offsetTop ?? 0);

      hoveredLineNumber.current = lineNumber;

      if (addPrintStatementElement) {
        addPrintStatementElement.classList.toggle(
          "has-log-value",
          Boolean(getBreakpoint()?.options.logValue)
        );

        addPrintStatementElement.style.transform = `translateY(${lineOffsetTop}px)`;
      }
    };
    const onLineLeave = () => {
      hoveredLineNumber.current = null;
    };

    sourceEditor.codeMirror.on("lineMouseEnter", onLineEnter);
    sourceEditor.codeMirror.on("lineMouseLeave", onLineLeave);

    return () => {
      sourceEditor.codeMirror.off("lineMouseEnter", onLineEnter);
      sourceEditor.codeMirror.off("lineMouseLeave", onLineLeave);
    };
  }, [sourceEditor, getBreakpoint]);

  return (
    <KeyModifiersContext.Consumer>
      {keyModifiers => <QuickActions keyModifiers={keyModifiers} onAddLogpoint={onAddLogpoint} />}
    </KeyModifiersContext.Consumer>
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
