import { SameLineSourceLocations } from "@replayio/protocol";
import { CSSProperties, useContext, useMemo } from "react";

import {
  ExecutionPointLineHighlight,
  LineHighlight,
  SearchResultLineHighlight,
  ViewSourceLineHighlight,
} from "replay-next/components/sources/hooks/useLineHighlights";
import { SourceSearchResult } from "replay-next/components/sources/hooks/useSourceSearch";
import SearchResultHighlight from "replay-next/components/sources/SearchResultHighlight";
import SourceLineLoadingPlaceholder from "replay-next/components/sources/SourceLineLoadingPlaceholder";
import { SourceListRowFormattedText } from "replay-next/components/sources/SourceListRowFormattedText";
import { SourceListRowLineHighlight } from "replay-next/components/sources/SourceListRowLineHighlight";
import { SourceListRowMouseEvents } from "replay-next/components/sources/SourceListRowMouseEvents";
import { SourceSearchContext } from "replay-next/components/sources/SourceSearchContext";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { PointBehaviorsObject } from "replay-next/src/contexts/points/types";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { find } from "replay-next/src/utils/array";
import { ParsedToken } from "replay-next/src/utils/syntax-parser";
import { LineHitCounts, POINT_BEHAVIOR_DISABLED, Point } from "shared/client/types";

import LogPointPanel from "./log-point-panel/LogPointPanel";
import { formatHitCount } from "./utils/formatHitCount";
import { findPointForLocation, findPointsForLocation } from "./utils/points";
import styles from "./SourceListRow.module.css";

export type ItemData = {
  breakablePositionsByLine: Map<number, SameLineSourceLocations>;
  executionPointLineHighlight: ExecutionPointLineHighlight | null;
  hitCounts: Array<[lineNumber: number, lineHitCounts: LineHitCounts]> | null;
  lineHeight: number;
  maxHitCount: number | undefined;
  minHitCount: number | undefined;
  parsedTokens: ParsedToken[][] | null;
  plainText: string[] | null;
  pointsForDefaultPriority: Point[];
  pointsForSuspense: Point[];
  pointBehaviors: PointBehaviorsObject;
  searchResultLineHighlight: SearchResultLineHighlight | null;
  source: Source;
  viewSourceLineHighlight: ViewSourceLineHighlight | null;
};

export default function SourceListRow({
  data,
  index: lineIndex,
  isScrolling = false,
  style,
}: {
  data: ItemData;
  index: number;
  isScrolling?: boolean;
  style: CSSProperties;
}) {
  const {
    breakablePositionsByLine,
    executionPointLineHighlight,
    hitCounts,
    maxHitCount,
    minHitCount,
    parsedTokens,
    plainText,
    pointBehaviors,
    pointsForDefaultPriority,
    pointsForSuspense,
    searchResultLineHighlight,
    source,
    viewSourceLineHighlight,
  } = data;

  const lineNumber = lineIndex + 1;
  const { sourceId } = source;

  const { isTransitionPending: isFocusRangePending } = useContext(FocusContext);
  const [{ enabled: searchEnabled, index: searchResultIndex, results: searchResults }] =
    useContext(SourceSearchContext);

  const visibleSearchResults = useMemo<SourceSearchResult[]>(
    () => (searchEnabled ? searchResults.filter(result => result.lineIndex == lineIndex) : []),
    [lineIndex, searchEnabled, searchResults]
  );

  const currentSearchResult = searchResults[searchResultIndex] || null;

  let hitCount = 0;
  let lineHitCounts: LineHitCounts | null = null;

  if (hitCounts != null) {
    const hitCountTuple = find(hitCounts, [lineNumber] as any, (a, b) => a[0] - b[0]);
    if (hitCountTuple) {
      hitCount = hitCountTuple[1].count;
      lineHitCounts = hitCountTuple[1];
    }
  }

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

  let hitCountClassName = getHitCountClassName(hitCount ?? 0, maxHitCount, minHitCount);
  if (isFocusRangePending) {
    hitCountClassName = `${hitCountClassName} ${styles.LineHitCountPending}`;
  }

  let lineHighlight: LineHighlight | null = null;
  if (executionPointLineHighlight?.lineIndex === lineIndex) {
    lineHighlight = executionPointLineHighlight;
  } else if (searchResultLineHighlight?.lineIndex === lineIndex) {
    lineHighlight = searchResultLineHighlight;
  } else if (viewSourceLineHighlight?.lineIndex === lineIndex) {
    lineHighlight = viewSourceLineHighlight;
  }

  return (
    <div
      className={styles.Row}
      data-test-line-has-hits={lineHitCounts != null ? hitCount > 0 : undefined}
      data-test-line-number={lineNumber}
      data-test-id={`SourceLine-${lineNumber}`}
      data-test-name="SourceLine"
      style={style}
    >
      {/**
       * Certain user interactions don't occur while scrolling,
       * so we can avoid rendering them so that we scrolls more smoothly.
       * This includes interactions like the hover button (used to add log points or to seek),
       * as well as right-click context menu action.
       */}
      {isScrolling || (
        <SourceListRowMouseEvents
          lineHasLogPoint={showPointPanel}
          lineHitCounts={lineHitCounts}
          lineNumber={lineNumber}
          pointBehavior={pointBehavior}
          pointsForLine={pointsForLine}
          source={source}
        />
      )}

      {lineHighlight && (
        <SourceListRowLineHighlight
          breakablePositionsByLine={breakablePositionsByLine}
          lineHighlight={lineHighlight}
          lineLength={plainText?.[0].length ?? 0}
        />
      )}

      <div className={styles.LineNumber} data-test-name="SourceLine-LineNumber">
        {lineNumber}
      </div>
      <div className={hitCountClassName} data-test-name="SourceLine-HitCount">
        {hitCount > 0 ? formatHitCount(hitCount) : ""}
      </div>
      {visibleSearchResults.map(searchResult => (
        <SearchResultHighlight
          key={`${searchResult.lineIndex}-${searchResult.columnIndex}`}
          isActive={searchResult === currentSearchResult}
          searchResultColumnIndex={searchResult.columnIndex}
          searchText={searchResult.text}
        />
      ))}
      {plainText == null ? (
        <SourceLineLoadingPlaceholder />
      ) : (
        <SourceListRowFormattedText
          parsedTokens={parsedTokens ? parsedTokens[lineIndex] ?? null : null}
          plainText={plainText[lineIndex] ?? null}
        />
      )}
      {showPointPanel && (
        <LogPointPanel
          className={styles.PointPanel}
          pointForDefaultPriority={pointForDefaultPriority}
          pointForSuspense={pointForSuspense!}
        />
      )}
    </div>
  );
}

function getHitCountClassName(
  hitCount: number,
  maxHitCount: number | undefined,
  minHitCount: number | undefined
): string {
  // We use a gradient to indicate the "heat" (the number of hits).
  // This absolute hit count values are relative, per file.
  // Cubed root prevents high hit counts from lumping all other values together.
  const NUM_GRADIENT_COLORS = 3;

  let hitCountIndex = NUM_GRADIENT_COLORS - 1;
  if (hitCount > 0 && minHitCount != null && maxHitCount != null) {
    if (minHitCount !== maxHitCount) {
      hitCountIndex = Math.min(
        NUM_GRADIENT_COLORS - 1,
        Math.round(((hitCount - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS)
      );
    }

    return styles[`LineHitCount${hitCountIndex + 1}`];
  }

  return styles.LineHitCount0;
}
