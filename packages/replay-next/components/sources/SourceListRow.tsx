import { newSource as ProtocolSource, SameLineSourceLocations } from "@replayio/protocol";
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
  useSyncExternalStore,
} from "react";
import { areEqual } from "react-window";

import Icon from "replay-next/components/Icon";
import SearchResultHighlight from "replay-next/components/sources/SearchResultHighlight";
import { SourceSearchContext } from "replay-next/components/sources/SourceSearchContext";
import useSourceContextMenu from "replay-next/components/sources/useSourceContextMenu";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { AddPoint, DeletePoints, EditPoint } from "replay-next/src/contexts/PointsContext";
import { ParsedToken, StreamingParser } from "replay-next/src/suspense/SyntaxParsingCache";
import { LineNumberToHitCountMap } from "shared/client/types";
import { Point } from "shared/client/types";

import ColumnBreakpointMarker from "./ColumnBreakpointMarker";
import CurrentLineHighlight from "./CurrentLineHighlight";
import HoverButton from "./HoverButton";
import PointPanel from "./PointPanel";
import SourceLineLoadingPlaceholder from "./SourceLineLoadingPlaceholder";
import { formatHitCount } from "./utils/formatHitCount";
import { findPointsForLocation } from "./utils/points";
import styles from "./SourceListRow.module.css";

// Primarily exists as a way for e2e tests to disable syntax highlighting
// to simulate large files that aren't fully parsed.
const syntaxHighlightingEnabled =
  typeof window !== "undefined" &&
  new URL(window?.location?.href).searchParams.get("disableSyntaxHighlighting") == null;

export type ItemData = {
  addPoint: AddPoint;
  breakablePositionsByLine: Map<number, SameLineSourceLocations>;
  deletePoints: DeletePoints;
  editPoint: EditPoint;
  hitCounts: LineNumberToHitCountMap | null;
  maxHitCount: number | null;
  minHitCount: number | null;
  onLineMouseEnter: (lineIndex: number, lineNumberNode: HTMLElement) => void;
  onLineMouseLeave: (lineIndex: number, lineNumberNode: HTMLElement) => void;
  points: Point[];
  showColumnBreakpoints: boolean;
  showHitCounts: boolean;
  source: ProtocolSource;
  streamingParser: StreamingParser;
};

const SourceListRow = memo(
  ({ data, index, style }: { data: ItemData; index: number; style: CSSProperties }) => {
    const { isTransitionPending: isFocusRangePending } = useContext(FocusContext);
    const [searchState] = useContext(SourceSearchContext);

    const [isHovered, setIsHovered] = useState(false);

    const loadingPlaceholderWidth = useMemo(() => Math.round(5 + Math.random() * 30), []);

    const lineNumber = index + 1;

    const {
      addPoint,
      breakablePositionsByLine,
      deletePoints,
      editPoint,
      hitCounts,
      maxHitCount,
      minHitCount,
      onLineMouseEnter,
      onLineMouseLeave,
      points,
      showColumnBreakpoints,
      showHitCounts,
      source,
      streamingParser,
    } = data;

    const { sourceId } = source;

    const parsedTokensByLine = useSyncExternalStore(
      streamingParser.subscribe,
      () => streamingParser.parsedTokensByLine,
      () => streamingParser.parsedTokensByLine
    );

    const rawTextByLine = useSyncExternalStore(
      streamingParser.subscribe,
      () => streamingParser.rawTextByLine,
      () => streamingParser.rawTextByLine
    );

    const lineHitCounts = hitCounts?.get(lineNumber) || null;

    let tokens: ParsedToken[] | null = null;
    if (syntaxHighlightingEnabled && index < parsedTokensByLine.length) {
      tokens = parsedTokensByLine[index] ?? null;
    }

    const plainText = index < rawTextByLine.length ? rawTextByLine[index] : null;

    const pointsForLine = findPointsForLocation(points, sourceId, lineNumber);
    const firstPoint = pointsForLine[0] ?? null;

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

    const showBreakpointMarkers = showColumnBreakpoints && firstPoint != null;
    const breakableColumnIndices = breakablePositionsByLine.get(lineNumber)?.columns ?? [];

    const renderBetween = (
      rendered: ReactNode[],
      columnIndexStart: number,
      columnIndexEnd: number
    ) => {
      if (tokens) {
        for (let index = 0; index < tokens.length; index++) {
          const token = tokens[index];
          if (token.columnIndex + token.value.length > columnIndexEnd) {
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

          lineSegments.push(
            <ColumnBreakpointMarker
              addPoint={addPoint}
              columnIndex={columnIndex}
              deletePoints={deletePoints}
              editPoint={editPoint}
              key={lineSegments.length}
              lineNumber={lineNumber}
              point={pointsForLine.find(point => point.location.column === columnIndex) ?? null}
              sourceId={sourceId}
            />
          );

          lastColumnIndex = columnIndex;
        }

        if (lastColumnIndex < plainText.length - 1) {
          renderBetween(lineSegments, lastColumnIndex, plainText.length - 1);
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
            shouldBreak: true,
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
        if (firstPoint.shouldLog || firstPoint.shouldShowPointPanel) {
          editPoint(firstPoint.id, { shouldBreak: !firstPoint.shouldBreak });
        } else {
          deletePoints(...pointsForLine.map(point => point.id));
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

    const currentSearchResult = searchState.results[searchState.index] || null;
    const searchResultsForLine = useMemo(
      () => searchState.results.filter(result => result.lineIndex === index),
      [index, searchState.results]
    );

    return (
      <div
        className={styles.Row}
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
          onContextMenu={onContextMenu}
        >
          <div className={styles.LineNumber} data-test-id={`SourceLine-LineNumber-${lineNumber}`}>
            {lineNumber}
            <div
              className={
                firstPoint?.shouldBreak ? styles.BreakpointToggleOn : styles.BreakpointToggleOff
              }
              data-test-name="BreakpointToggle"
              data-test-state={firstPoint?.shouldBreak ? "on" : "off"}
              onClick={toggleBreakpoint}
            >
              {lineNumber}
            </div>
          </div>

          <div className={`${styles.LineHitCountBar} ${hitCountBarClassName}`} />
          {showHitCounts && (
            <div className={`${styles.LineHitCountLabel} ${hitCountLabelClassName}`}>
              {hitCount !== null ? formatHitCount(hitCount) : ""}
            </div>
          )}

          <div className={styles.LineSegmentsAndPointPanel}>
            {searchResultsForLine.map((result, resultIndex) => (
              <SearchResultHighlight
                breakableColumnIndices={breakableColumnIndices}
                key={resultIndex}
                isActive={result === currentSearchResult}
                searchResultColumnIndex={result.columnIndex}
                searchText={result.text}
                showColumnBreakpoints={showColumnBreakpoints && pointsForLine.length > 0}
              />
            ))}

            {lineSegments}

            {/* Workaround for FE-1025 */}
            <div className={styles.HoverButtonCompanion}></div>

            {isHovered && (
              <Suspense>
                <HoverButton
                  addPoint={addPoint}
                  buttonClassName={styles.HoverButton}
                  deletePoints={deletePoints}
                  editPoint={editPoint}
                  iconClassName={styles.HoverButtonIcon}
                  lineHitCounts={lineHitCounts}
                  lineNumber={lineNumber}
                  point={firstPoint}
                  source={source}
                />
              </Suspense>
            )}
          </div>

          {(firstPoint?.shouldLog || firstPoint?.shouldShowPointPanel) && (
            <PointPanel className={styles.PointPanel} point={firstPoint} />
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
  let inspectable = token.types
    ? token.types.some(type => {
        switch (type) {
          case "definition":
          case "local":
          case "propertyName":
          case "typeName":
          case "variableName":
          case "variableName2":
            return true;
            break;
        }
        return false;
      })
    : false;

  let className = undefined;
  if (token.types) {
    className = token.types.map(type => `tok-${type}`).join(" ");
  }

  return (
    <span
      className={className}
      data-column-index={token.columnIndex}
      data-inspectable-token={inspectable || undefined}
      key={key}
    >
      {token.value}
    </span>
  );
}
