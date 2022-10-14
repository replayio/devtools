import { PointDescription, SourceId, TimeStampedPointRange } from "@replayio/protocol";
import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { getHitPointsForLocation } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import { getSource, getSourceHitCounts } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { getSourceFileName } from "bvaughn-architecture-demo/src/utils/source";
import classNames from "classnames";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getExecutionPoint, getSymbols } from "devtools/client/debugger/src/selectors";
import { findClosestFunction } from "devtools/client/debugger/src/utils/ast";
import findLast from "lodash/findLast";
import { compareNumericStrings } from "protocol/utils";
import { createPortal } from "react-dom";
import React, {
  useState,
  useEffect,
  MouseEvent,
  MouseEventHandler,
  FC,
  ReactNode,
  Suspense,
  useContext,
} from "react";
import { Point } from "shared/client/types";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seek } from "ui/actions/timeline";
import { KeyModifiers, KeyModifiersContext } from "ui/components/KeyModifiers";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { useFeature } from "ui/hooks/settings";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { shouldShowNag } from "ui/utils/user";
import { Nag } from "ui/hooks/users";

import { AWESOME_BACKGROUND } from "./LineNumberTooltip";

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
      onClick={disabled ? undefined : onClick}
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

const ToggleLogPoint: FC<{ showNag: boolean; onClick: () => void; point?: Point }> = ({
  showNag,
  onClick,
  point,
}) => {
  const icon = point?.shouldLog ? "remove" : "add";

  return (
    <QuickActionButton dataTestId="ToggleLogpointButton" showNag={showNag} onClick={onClick}>
      <MaterialIcon>{icon}</MaterialIcon>
    </QuickActionButton>
  );
};

function QuickActions({
  columnIndex,
  focusRange,
  lineIndex,
  keyModifiers,
  onMouseDown,
  point,
  sourceId,
  targetNode,
}: {
  columnIndex: number;
  focusRange: TimeStampedPointRange | null;
  lineIndex: number;
  keyModifiers: KeyModifiers;
  onMouseDown: MouseEventHandler;
  point?: Point;
  sourceId: SourceId;
  targetNode: HTMLElement;
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

  const replayClient = useContext(ReplayClientContext);
  const { addPoint, deletePoints, editPoint } = useContext(PointsContext);
  const source = getSource(replayClient, sourceId);
  const fileName = source ? getSourceFileName(source) : null;

  const lineNumber = lineIndex + 1;

  const [hitPoints, hitPointStatus] = getHitPointsForLocation(
    replayClient,
    {
      sourceId,
      column: columnIndex,
      line: lineNumber,
    },
    null,
    focusRange
  );

  const symbols = useAppSelector(state =>
    source ? getSymbols(state, { id: source.sourceId, url: source.url }) : null
  );

  const onToggleLogPoint = () => {
    if (point) {
      if (point.shouldLog) {
        if (point.shouldBreak) {
          editPoint(point.id, { shouldLog: false });
        } else {
          deletePoints(point.id);
        }
      } else {
        const closestFunction = symbols
          ? findClosestFunction(symbols, { column: columnIndex, line: lineNumber })
          : null;
        let content = closestFunction
          ? `"${closestFunction.name}", ${lineNumber}`
          : `"${fileName!}", ${lineNumber}`;

        editPoint(point.id, {
          content,
          shouldLog: true,
        });
      }
    } else {
      const closestFunction = symbols
        ? findClosestFunction(symbols, { column: columnIndex, line: lineNumber })
        : null;
      let content = closestFunction
        ? `"${closestFunction.name}", ${lineNumber}`
        : `"${fileName!}", ${lineNumber}`;

      addPoint(
        {
          content,
          shouldLog: true,
        },
        {
          column: columnIndex,
          line: lineNumber,
          sourceId,
        }
      );
    }
  };

  let next: PointDescription | undefined, prev: PointDescription | undefined;

  const error = hitPointStatus === "too-many-points-to-find";

  if (!error && executionPoint) {
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

  if (isMetaActive && isShiftActive) {
    button = (
      <ContinueToPrevious showNag={showNag} onClick={onContinueToPrevious} disabled={!prev} />
    );
  } else if (isMetaActive) {
    button = <ContinueToNext showNag={showNag} onClick={onContinueToNext} disabled={!next} />;
  } else if (hitPoints.length > 0) {
    button = <ToggleLogPoint point={point} showNag={showNag} onClick={onToggleLogPoint} />;
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

function ToggleWidgetButton() {
  const { points } = useContext(PointsContext);
  const { focusedSourceId, hoveredLineIndex, hoveredLineNode, visibleLines } =
    useContext(SourcesContext);

  const replayClient = useContext(ReplayClientContext);

  const { range: focusRange } = useContext(FocusContext);

  if (!focusedSourceId || !visibleLines || !hoveredLineNode || hoveredLineIndex === null) {
    return null;
  }

  const lineNumber = hoveredLineIndex + 1;

  const point = points.find((b: any) => b.location.line === lineNumber);

  const onMouseDown = (event: MouseEvent) => {
    // This keeps the cursor in CodeMirror from moving after clicking on the button.
    event.stopPropagation();
  };

  // This widget floats to the left, beside the line number gutter.
  // It should always add a new Point for the left-most column, regardless of the column breakpoints setting.
  let firstBreakableColumnIndex: number | null = null;

  const hitCounts = getSourceHitCounts(replayClient, focusedSourceId, visibleLines, focusRange);
  const hitCountsForLine = hitCounts.get(lineNumber)!;
  if (hitCountsForLine) {
    firstBreakableColumnIndex = hitCountsForLine.firstBreakableColumnIndex;
  }

  if (firstBreakableColumnIndex === null) {
    return null;
  }

  return createPortal(
    <KeyModifiersContext.Consumer>
      {keyModifiers => (
        <QuickActions
          columnIndex={firstBreakableColumnIndex!}
          focusRange={focusRange}
          lineIndex={hoveredLineIndex}
          onMouseDown={onMouseDown}
          point={point}
          sourceId={focusedSourceId}
          targetNode={hoveredLineNode}
          keyModifiers={keyModifiers}
        />
      )}
    </KeyModifiersContext.Consumer>,
    hoveredLineNode
  );
}

export default function ToggleWidgetButtonSuspenseWrapper() {
  return (
    <Suspense fallback={null}>
      <ToggleWidgetButton />
    </Suspense>
  );
}
