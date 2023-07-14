import { SameLineSourceLocations } from "@replayio/protocol";
import {
  CSSProperties,
  MouseEvent,
  ReactElement,
  ReactNode,
  Suspense,
  memo,
  useContext,
  useMemo,
  useState,
} from "react";
import { areEqual } from "react-window";
import { useStreamingValue } from "suspense";

import CurrentColumnHighlight from "replay-next/components/sources/CurrentColumnHighlight";
import useGetDefaultLogPointContent from "replay-next/components/sources/hooks/useGetDefaultLogPointContent";
import SearchResultHighlight from "replay-next/components/sources/SearchResultHighlight";
import { SourceSearchContext } from "replay-next/components/sources/SourceSearchContext";
import useSourceContextMenu from "replay-next/components/sources/useSourceContextMenu";
import { getClassNames, isTokenInspectable } from "replay-next/components/sources/utils/tokens";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { PointBehaviorsObject } from "replay-next/src/contexts/points/types";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { StreamingParser } from "replay-next/src/suspense/SyntaxParsingCache";
import { ParsedToken } from "replay-next/src/utils/syntax-parser";
import {
  LineNumberToHitCountMap,
  POINT_BEHAVIOR_DISABLED,
  POINT_BEHAVIOR_DISABLED_TEMPORARILY,
  POINT_BEHAVIOR_ENABLED,
  Point,
} from "shared/client/types";

import ColumnBreakpointMarker from "./ColumnBreakpointMarker";
import CurrentLineHighlight from "./CurrentLineHighlight";
import HoverButton from "./HoverButton";
import LogPointPanel from "./log-point-panel/LogPointPanel";
import SourceLineLoadingPlaceholder from "./SourceLineLoadingPlaceholder";
import { formatHitCount } from "./utils/formatHitCount";
import { findPointForLocation, findPointsForLocation } from "./utils/points";
import styles from "./SourceListRow.module.css";

// Primarily exists as a way for e2e tests to disable syntax highlighting
// to simulate large files that aren't fully parsed.
const disableSyntaxHighlightingForTests =
  typeof window !== "undefined" &&
  new URL(window?.location?.href).searchParams.get("disableSyntaxHighlighting") != null;

export type ItemData = {
  breakablePositionsByLine: Map<number, SameLineSourceLocations>;
  hitCounts: LineNumberToHitCountMap | null;
  maxHitCount: number | null;
  minHitCount: number | null;
  onLineMouseEnter: (lineIndex: number, lineNumberNode: HTMLElement) => void;
  onLineMouseLeave: (lineIndex: number, lineNumberNode: HTMLElement) => void;
  pointPanelHeight: number;
  pointPanelWithConditionalHeight: number;
  pointsForDefaultPriority: Point[];
  pointsForSuspense: Point[];
  pointBehaviors: PointBehaviorsObject;
  showColumnBreakpoints: boolean;
  source: Source;
  streamingParser: StreamingParser;
};

const SourceListRow = memo(
  ({ data, index, style }: { data: ItemData; index: number; style: CSSProperties }) => {
    const { currentUserInfo } = useContext(SessionContext);
    const { setCursorLocation } = useContext(SourcesContext);
    const { isTransitionPending: isFocusRangePending } = useContext(FocusContext);
    const { addPoint, deletePoints, editPendingPointText, editPointBehavior } =
      useContext(PointsContext);
    const [searchState] = useContext(SourceSearchContext);

    const setCursorLocationFromMouseEvent = (event: MouseEvent) => {
      const { target } = event;
      const htmlElement = target as HTMLElement;
      const columnIndexAttribute = htmlElement.getAttribute("data-column-index");
      const columnIndex = columnIndexAttribute ? parseInt(columnIndexAttribute) : 0;
      setCursorLocation(index, columnIndex);
    };

    const [isHovered, setIsHovered] = useState(false);

    const loadingPlaceholderWidth = useMemo(() => Math.round(5 + Math.random() * 30), []);

    const lineNumber = index + 1;

    const {
      breakablePositionsByLine,
      hitCounts,
      maxHitCount,
      minHitCount,
      onLineMouseEnter,
      onLineMouseLeave,
      pointBehaviors,
      pointsForDefaultPriority,
      pointsForSuspense,
      showColumnBreakpoints,
      source,
      streamingParser,
    } = data;

    const { sourceId } = source;

    const { data: streamingData, value: streamingValue } = useStreamingValue(streamingParser);

    const plainText = streamingData?.plainText[index] ?? null;

    let tokens: ParsedToken[] | null = streamingValue?.[index] ?? null;

    let testStateContents = "loading";
    if (tokens !== null) {
      testStateContents = "parsed";
    } else if (plainText !== null) {
      testStateContents = "loaded";
    }

    if (disableSyntaxHighlightingForTests) {
      tokens = null;
    }

    const lineHitCounts = hitCounts?.get(lineNumber) || null;

    let testStateHitCounts = "loading";
    if (hitCounts !== null) {
      testStateHitCounts = "loaded";
    }

    const getDefaultLogPointContent = useGetDefaultLogPointContent({
      lineHitCounts,
      lineNumber,
      source,
    });

    const pointForSuspense = findPointForLocation(pointsForSuspense, sourceId, lineNumber);
    const pointsForLine = findPointsForLocation(pointsForDefaultPriority, sourceId, lineNumber);
    const pointForDefaultPriority = pointsForLine[0] ?? null;
    const pointBehavior = pointForDefaultPriority
      ? pointBehaviors[pointForDefaultPriority.key] ?? null
      : null;

    let showPointPanel = false;
    if (pointForDefaultPriority && pointForSuspense) {
      if (pointBehavior) {
        showPointPanel = pointBehavior.shouldLog !== POINT_BEHAVIOR_DISABLED;
      } else {
        showPointPanel = !!pointForDefaultPriority.content;
      }
    }

    const hitCount = lineHitCounts?.count || null;
    const lineHasHits = hitCount !== null && hitCount > 0;

    // We use a gradient to indicate the "heat" (the number of hits).
    // This absolute hit count values are relative, per file.
    // Cubed root prevents high hit counts from lumping all other values together.
    const NUM_GRADIENT_COLORS = 3;
    let hitCountBarClassName = styles.LineHitCountBar0;
    let hitCountLabelClassName = styles.LineHitCountLabel0;
    let hitCountIndex = NUM_GRADIENT_COLORS - 1;
    if (hitCount !== null && minHitCount !== null && maxHitCount !== null) {
      if (minHitCount !== maxHitCount) {
        hitCountIndex = Math.min(
          NUM_GRADIENT_COLORS - 1,
          Math.round(((hitCount - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS)
        );
      }

      hitCountBarClassName = styles[`LineHitCountBar${hitCountIndex + 1}`];
      hitCountLabelClassName = styles[`LineHitCountLabel${hitCountIndex + 1}`];
    }

    if (isFocusRangePending) {
      hitCountLabelClassName = `${hitCountLabelClassName} ${styles.LineHitCountLabelPending}`;
    }

    const showBreakpointMarkers = showColumnBreakpoints && pointForDefaultPriority != null;
    const breakableColumnIndices = breakablePositionsByLine.get(lineNumber)?.columns ?? [];

    const renderBetween = (
      rendered: ReactNode[],
      columnIndexStart: number,
      columnIndexEnd: number
    ) => {
      if (tokens) {
        for (let index = 0; index < tokens.length; index++) {
          const token = tokens[index];
          if (token.columnIndex >= columnIndexEnd) {
            break;
          } else if (token.columnIndex >= columnIndexStart) {
            rendered.push(
              <pre className={styles.LineSegment} key={rendered.length}>
                {renderToken(token)}
              </pre>
            );
          }
        }
      } else if (plainText) {
        rendered.push(
          <pre
            className={styles.LineSegment}
            data-test-name="SourceListRow-LineSegment-PlainText"
            key={rendered.length}
          >
            {plainText.substring(columnIndexStart, columnIndexEnd)}
          </pre>
        );
      }
    };

    let lineSegments = null;
    if (plainText !== null) {
      if (showBreakpointMarkers) {
        lineSegments = [];

        let lastColumnIndex = 0;

        for (let i = 0; i < breakableColumnIndices.length; i++) {
          const columnIndex = breakableColumnIndices[i];

          if (columnIndex > lastColumnIndex) {
            renderBetween(lineSegments, lastColumnIndex, columnIndex);
          }

          const pointForDefaultPriority =
            pointsForLine.find(point => point.location.column === columnIndex) ?? null;
          const pointBehavior = pointForDefaultPriority
            ? pointBehaviors[pointForDefaultPriority.key] ?? null
            : null;

          lineSegments.push(
            <ColumnBreakpointMarker
              addPoint={addPoint}
              columnIndex={columnIndex}
              currentUserInfo={currentUserInfo}
              deletePoints={deletePoints}
              editPointBehavior={editPointBehavior}
              key={lineSegments.length}
              lineNumber={lineNumber}
              point={pointsForLine.find(point => point.location.column === columnIndex) ?? null}
              pointBehavior={pointBehavior}
              sourceId={sourceId}
            />
          );

          lastColumnIndex = columnIndex;
        }

        if (lastColumnIndex < plainText.length - 1) {
          renderBetween(lineSegments, lastColumnIndex, plainText.length);
        }
      } else {
        if (tokens !== null) {
          lineSegments = (
            <pre className={styles.LineSegment}>
              {tokens.map((token, index) => renderToken(token, index))}
            </pre>
          );
        } else {
          lineSegments = (
            <pre
              className={styles.LineSegment}
              data-test-name="SourceListRow-LineSegment-PlainText"
            >
              {plainText}
            </pre>
          );
        }
      }
    } else {
      lineSegments = <SourceLineLoadingPlaceholder width={loadingPlaceholderWidth} />;
    }

    const toggleBreakpoint = () => {
      if (lineHitCounts === null) {
        return;
      }

      // If there are no breakpoints on this line,
      // Clicking the breakpoint toggle should add one at the first breakable column.
      if (pointsForLine.length === 0) {
        addPoint(
          {
            badge: null,
            condition: null,
            content: getDefaultLogPointContent() || "",
          },
          {
            shouldBreak: POINT_BEHAVIOR_ENABLED,
            shouldLog: POINT_BEHAVIOR_DISABLED,
          },
          {
            column: lineHitCounts.firstBreakableColumnIndex,
            line: lineNumber,
            sourceId,
          }
        );
      } else {
        // If there are breakpoints on this line,
        // The breakable gutter marker reflects the state of the first breakpoint on the line.
        // Toggling the breakpoint on should enable breaking behavior for that point.
        // Toggling it off depends on whether the point also logs.
        // 1. If it logs and breaks, then we should disable breaking
        // 2. If it only breaks then we should delete that point (and all others on the line)
        if (showPointPanel) {
          editPointBehavior(
            pointForDefaultPriority.key,
            {
              shouldBreak:
                pointBehavior?.shouldBreak === POINT_BEHAVIOR_DISABLED ||
                pointBehavior?.shouldBreak === POINT_BEHAVIOR_DISABLED_TEMPORARILY
                  ? POINT_BEHAVIOR_ENABLED
                  : POINT_BEHAVIOR_DISABLED,
            },
            pointForDefaultPriority.user?.id === currentUserInfo?.id
          );
        } else {
          deletePoints(...pointsForLine.map(point => point.key));
        }
      }
    };

    const onMouseEnter = (event: MouseEvent) => {
      setIsHovered(true);
      onLineMouseEnter(index, event.currentTarget as HTMLDivElement);
    };

    const onMouseLeave = (event: MouseEvent) => {
      setIsHovered(false);
      onLineMouseLeave(index, event.currentTarget as HTMLDivElement);
    };

    const { contextMenu, onContextMenu } = useSourceContextMenu({
      lineNumber,
      sourceId: source.sourceId,
      sourceUrl: source.url ?? null,
    });

    const onContextMenuWrapper = (event: MouseEvent) => {
      onContextMenu(event);
      setCursorLocationFromMouseEvent(event);
    };

    const onClick = (event: MouseEvent) => {
      setCursorLocationFromMouseEvent(event);
    };

    const currentSearchResult = searchState.results[searchState.index] || null;
    const searchResultsForLine = useMemo(
      () =>
        searchState.enabled
          ? searchState.results.filter(result => result.lineIndex === index)
          : null,
      [index, searchState.enabled, searchState.results]
    );

    let breakPointTestState = "off";
    if (pointForDefaultPriority !== null) {
      switch (pointBehavior?.shouldBreak) {
        case POINT_BEHAVIOR_ENABLED:
          breakPointTestState = "on";
          break;
        case POINT_BEHAVIOR_DISABLED_TEMPORARILY:
          breakPointTestState = "off-temporarily";
          break;
        case POINT_BEHAVIOR_DISABLED:
        default:
          breakPointTestState = "off";
          break;
      }
    }

    return (
      <div
        className={styles.Row}
        data-test-hit-counts-state={testStateHitCounts}
        data-test-contents-state={testStateContents}
        data-test-id={`SourceLine-${lineNumber}`}
        data-test-name="SourceLine"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          ...style,

          // Each row should grow as much as needed to fit its code/content.
          // The parent list will measure rows after render and adjust the min-width of the list.
          // This prevents horizontal scrolling from jumping as new rows are rendered.
          width: undefined,
        }}
      >
        <div
          className={lineHasHits ? styles.LineWithHits : styles.LineWithoutHits}
          onContextMenu={onContextMenuWrapper}
          onClick={onClick}
        >
          <div className={styles.LineNumber} data-test-id={`SourceLine-LineNumber-${lineNumber}`}>
            <span data-test-name="SourceRowLineNumber">{lineNumber}</span>
            <div
              className={styles.BreakpointToggle}
              data-test-name="BreakpointToggle"
              data-test-state={breakPointTestState}
              onClick={toggleBreakpoint}
            >
              {lineNumber}
            </div>
          </div>

          <div className={`${styles.LineHitCountBar} ${hitCountBarClassName}`} />
          <div className={`${styles.LineHitCountLabel} ${hitCountLabelClassName}`}>
            {hitCount !== null ? formatHitCount(hitCount) : ""}
          </div>

          <div className={styles.LineSegmentsAndPointPanel} data-test-name="SourceLine-Contents">
            {searchResultsForLine?.map((result, resultIndex) => (
              <SearchResultHighlight
                breakableColumnIndices={breakableColumnIndices}
                key={resultIndex}
                isActive={result === currentSearchResult}
                searchResultColumnIndex={result.columnIndex}
                searchText={result.text}
                showColumnBreakpoints={showColumnBreakpoints && pointsForLine.length > 0}
              />
            ))}

            <CurrentColumnHighlight
              breakableColumnIndices={breakableColumnIndices}
              lineNumber={lineNumber}
              plainText={plainText}
              showColumnBreakpoints={showColumnBreakpoints && pointsForLine.length > 0}
              sourceId={sourceId}
            />

            {lineSegments}

            {/* Workaround for FE-1025 */}
            <div className={styles.HoverButtonCompanion}></div>

            {isHovered && (
              <Suspense>
                <HoverButton
                  addPoint={addPoint}
                  buttonClassName={styles.HoverButton}
                  deletePoints={deletePoints}
                  editPendingPointText={editPendingPointText}
                  editPointBehavior={editPointBehavior}
                  iconClassName={styles.HoverButtonIcon}
                  lineHitCounts={lineHitCounts}
                  lineNumber={lineNumber}
                  point={pointForDefaultPriority}
                  pointBehavior={pointBehavior}
                  source={source}
                />
              </Suspense>
            )}
          </div>

          {showPointPanel && (
            <LogPointPanel
              className={styles.PointPanel}
              pointForDefaultPriority={pointForDefaultPriority}
              pointForSuspense={pointForSuspense!}
            />
          )}
        </div>

        <CurrentLineHighlight lineNumber={lineNumber} sourceId={sourceId} />

        {contextMenu}
      </div>
    );
  },
  areEqual
);

SourceListRow.displayName = "SourceListRow";

export default SourceListRow;

function renderToken(token: ParsedToken, key?: any): ReactElement {
  const classNames = getClassNames(token);
  const inspectable = isTokenInspectable(token);

  return (
    <span
      className={classNames.join(" ")}
      data-column-index={token.columnIndex}
      data-inspectable-token={inspectable || undefined}
      key={key}
    >
      {token.value}
    </span>
  );
}
