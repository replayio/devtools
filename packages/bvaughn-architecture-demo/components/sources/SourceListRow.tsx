import { newSource as ProtocolSource } from "@replayio/protocol";
import {
  CSSProperties,
  MouseEvent,
  Suspense,
  memo,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { areEqual } from "react-window";

import Icon from "bvaughn-architecture-demo/components/Icon";
import SearchResultHighlight from "bvaughn-architecture-demo/components/sources/SearchResultHighlight";
import { SourceSearchContext } from "bvaughn-architecture-demo/components/sources/SourceSearchContext";
import useSourceContextMenu from "bvaughn-architecture-demo/components/sources/useSourceContextMenu";
import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import {
  AddPoint,
  DeletePoints,
  EditPoint,
} from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { StreamingParser } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";
import { LineNumberToHitCountMap } from "shared/client/types";
import { Point } from "shared/client/types";

import CurrentLineHighlight from "./CurrentLineHighlight";
import HoverButton from "./HoverButton";
import PointPanel from "./PointPanel";
import SourceLineLoadingPlaceholder from "./SourceLineLoadingPlaceholder";
import { formatHitCount } from "./utils/formatHitCount";
import { findPointForLocation } from "./utils/points";
import styles from "./SourceListRow.module.css";

// Primarily exists as a way for e2e tests to disable syntax highlighting
// to simulate large files that aren't fully parsed.
const syntaxHighlightingEnabled =
  typeof window !== "undefined" &&
  new URL(window?.location?.href).searchParams.get("disableSyntaxHighlighting") == null;

export type ItemData = {
  addPoint: AddPoint;
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

    const parsedLines = useSyncExternalStore(
      streamingParser.subscribe,
      () => streamingParser.parsedLines,
      () => streamingParser.parsedLines
    );

    const rawLines = useSyncExternalStore(
      streamingParser.subscribe,
      () => streamingParser.rawLines,
      () => streamingParser.rawLines
    );

    const lineHitCounts = hitCounts?.get(lineNumber) || null;

    let html: string | null = null;
    if (syntaxHighlightingEnabled && index < parsedLines.length) {
      html = parsedLines[index] ?? null;
    }

    const plainText = index < rawLines.length ? rawLines[index] : null;

    const point = findPointForLocation(points, sourceId, lineNumber);

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

    const showColumnBreakpointMarker = showColumnBreakpoints && point?.shouldLog;

    let columnBreakpointMarker = null;
    if (showColumnBreakpointMarker) {
      columnBreakpointMarker = (
        <button
          className={styles.BreakpointButton}
          onClick={() => editPoint(point.id, { shouldBreak: !point.shouldBreak })}
        >
          <Icon
            className={point.shouldBreak ? styles.BreakpointIcon : styles.DisabledBreakpointIcon}
            type="breakpoint"
          />
        </button>
      );
    }

    let lineSegments = null;
    if (html !== null) {
      if (showColumnBreakpointMarker) {
        if (point.location.column === 0) {
          // Special case; much simpler.
          lineSegments = (
            <>
              {columnBreakpointMarker}
              <pre className={styles.LineSegment} dangerouslySetInnerHTML={{ __html: html }} />
            </>
          );
        } else {
          // HACK
          // This could possibly be done in a smarter way?
          const div = document.createElement("div");
          div.innerHTML = html;

          let htmlAfter = "";
          let htmlBefore = "";
          let columnIndex = 0;
          while (div.childNodes.length > 0) {
            const child = div.childNodes[0];

            htmlBefore += (child as HTMLElement).outerHTML || child.textContent;

            child.remove();

            columnIndex += child.textContent?.length || 0;
            if (columnIndex >= point.location.column) {
              htmlAfter = div.innerHTML;
              break;
            }
          }

          lineSegments = (
            <>
              <pre
                className={styles.LineSegment}
                dangerouslySetInnerHTML={{ __html: htmlBefore }}
              />
              {columnBreakpointMarker}
              <pre className={styles.LineSegment} dangerouslySetInnerHTML={{ __html: htmlAfter }} />
            </>
          );
        }
      } else {
        lineSegments = (
          <pre className={styles.LineSegment} dangerouslySetInnerHTML={{ __html: html }} />
        );
      }
    } else if (plainText !== null) {
      if (showColumnBreakpointMarker) {
        const textStart = plainText.substring(0, point.location.column);
        const textEnd = plainText.substring(point.location.column);

        lineSegments = (
          <>
            {textStart && (
              <pre
                className={styles.LineSegment}
                data-test-name="SourceListRow-LineSegment-PlainText"
              >
                {textStart}
              </pre>
            )}
            {columnBreakpointMarker}
            {textEnd && (
              <pre
                className={styles.LineSegment}
                data-test-name="SourceListRow-LineSegment-PlainText"
              >
                {textEnd}
              </pre>
            )}
          </>
        );
      } else {
        lineSegments = (
          <pre className={styles.LineSegment} data-test-name="SourceListRow-LineSegment-PlainText">
            {plainText}
          </pre>
        );
      }
    } else {
      lineSegments = <SourceLineLoadingPlaceholder width={loadingPlaceholderWidth} />;
    }

    const toggleBreakpoint = () => {
      if (lineHitCounts === null) {
        return;
      }

      if (point) {
        if (!point.shouldBreak || point.shouldLog) {
          editPoint(point.id, { shouldBreak: !point.shouldBreak });
        } else {
          deletePoints(point.id);
        }
      } else {
        // TODO The legacy app uses the closest function name for the content (if there is one).
        // This app doesn't yet have logic for parsing source contents though.
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
      firstBreakableColumnIndex: lineHitCounts?.firstBreakableColumnIndex ?? null,
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
                point?.shouldBreak ? styles.BreakpointToggleOn : styles.BreakpointToggleOff
              }
              data-test-name="BreakpointToggle"
              data-test-state={point?.shouldBreak ? "on" : "off"}
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
                key={resultIndex}
                columnBreakpointIndex={showColumnBreakpointMarker ? point.location.column : null}
                isActive={result === currentSearchResult}
                searchResultColumnIndex={result.columnIndex}
                searchText={result.text}
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
                  point={point}
                  source={source}
                />
              </Suspense>
            )}
          </div>

          {point?.shouldLog && <PointPanel className={styles.PointPanel} point={point} />}
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
