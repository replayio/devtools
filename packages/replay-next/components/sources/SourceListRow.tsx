import { SameLineSourceLocations } from "@replayio/protocol";
import { CSSProperties, useContext, useMemo } from "react";
import { STATUS_PENDING, useImperativeIntervalCacheValues } from "suspense";

import Icon from "replay-next/components/Icon";
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
import { sourceHitCountsCache } from "replay-next/src/suspense/SourceHitCountsCache";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { find } from "replay-next/src/utils/array";
import { bucketVisibleLines } from "replay-next/src/utils/source";
import { ParsedToken } from "replay-next/src/utils/syntax-parser";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { LineHitCounts, POINT_BEHAVIOR_DISABLED, Point } from "shared/client/types";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { toPointRange } from "shared/utils/time";

import LogPointPanel from "./log-point-panel/LogPointPanel";
import { formatHitCount } from "./utils/formatHitCount";
import { findPointForLocation, findPointsForLocation } from "./utils/points";
import styles from "./SourceListRow.module.css";

export type ItemData = {
  breakablePositionsByLine: Map<number, SameLineSourceLocations>;
  executionPointLineHighlight: ExecutionPointLineHighlight | null;
  lineHeight: number;
  maxHitCount: number | undefined;
  minHitCount: number | undefined;
  parsedTokens: ParsedToken[][] | null;
  plainText: string[] | null;
  pointsForSuspense: Point[];
  pointsWithPendingEdits: Point[];
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
    maxHitCount,
    minHitCount,
    parsedTokens,
    plainText,
    pointBehaviors,
    pointsForSuspense,
    pointsWithPendingEdits,
    searchResultLineHighlight,
    source,
    viewSourceLineHighlight,
  } = data;

  const lineNumber = lineIndex + 1;
  const { sourceId } = source;

  const { isTransitionPending: isFocusRangePending, range: focusRange } = useContext(FocusContext);
  const client = useContext(ReplayClientContext);
  const [{ enabled: searchEnabled, index: searchResultIndex, results: searchResults }] =
    useContext(SourceSearchContext);

  const [logPointPanelAbove] = useGraphQLUserData("feature_showLogPointPanelAboveLine");

  const visibleSearchResults = useMemo<SourceSearchResult[]>(
    () => (searchEnabled ? searchResults.filter(result => result.lineIndex == lineIndex) : []),
    [lineIndex, searchEnabled, searchResults]
  );

  const currentSearchResult = searchResults[searchResultIndex] || null;

  let hitCount = 0;
  let lineHitCounts: LineHitCounts | null = null;

  // We fetch hit count information as a user scrolls,
  // but naively fetching each line individually would result in a lot of requests,
  // so we batch requests up into chunks of 100 lines.
  //
  // Because we use an interval cache for this,
  // there is a potential issue on the boundaries where it's possible for hit counts to appear and disappear
  // because a batch of lines is only partially loaded (e.g. first we fetch lines 100-200 and then lines 100-300).
  //
  // We don't want loaded hit counts to disappear when a user scrolls,
  // so the easiest way to avoid that is to always request (cached) hit counts for the bucket the current line falls in.
  //
  // TRICKY (See FE-1956 for more detail)
  const bucket = bucketVisibleLines(lineIndex, lineIndex);
  const { status: hitCountsStatus, value: hitCounts } = useImperativeIntervalCacheValues(
    sourceHitCountsCache,
    bucket[0],
    bucket[1],
    client,
    sourceId,
    focusRange ? toPointRange(focusRange) : null
  );

  if (hitCounts != null) {
    const hitCountTuple = find(hitCounts, [lineNumber] as any, (a, b) => a[0] - b[0]);
    if (hitCountTuple) {
      hitCount = hitCountTuple[1].count;
      lineHitCounts = hitCountTuple[1];
    }
  }

  const pointForSuspense = findPointForLocation(pointsForSuspense, sourceId, lineNumber);
  const pointsForLine = findPointsForLocation(pointsWithPendingEdits, sourceId, lineNumber);
  const pointWithPendingEdits = pointsForLine[0] ?? null;
  const pointBehavior = pointWithPendingEdits
    ? pointBehaviors[pointWithPendingEdits.key] ?? null
    : null;

  let showPointPanel = false;
  if (pointWithPendingEdits) {
    if (pointBehavior) {
      showPointPanel = pointBehavior.shouldLog !== POINT_BEHAVIOR_DISABLED;
    } else {
      showPointPanel = !!pointWithPendingEdits.content;
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
      data-log-point-placement={logPointPanelAbove ? "above" : "below"}
      data-test-hitcounts-loaded={hitCounts != null ? true : undefined}
      data-test-line-has-hits={lineHitCounts != null ? hitCount > 0 : undefined}
      data-test-line-number={lineNumber}
      data-test-id={`SourceLine-${lineNumber}`}
      data-test-is-scrolling={isScrolling || undefined}
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
          lineLength={plainText?.[lineIndex]?.length ?? 0}
        />
      )}

      <div className={styles.LineNumber} data-test-name="SourceLine-LineNumber">
        {lineNumber}
      </div>
      <div className={hitCountClassName} data-test-name="SourceLine-HitCount">
        {hitCountsStatus === STATUS_PENDING ? (
          <div className={styles.LineHitCountPendingMarker}>•••</div>
        ) : hitCount > 0 ? (
          formatHitCount(hitCount)
        ) : (
          ""
        )}
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
        <Icon
          className={styles.LogPointPanelIcon}
          type={logPointPanelAbove ? "log-point-panel-arrow-above" : "log-point-panel-arrow-below"}
        />
      )}
      {showPointPanel && (
        <LogPointPanel
          className={styles.LogPointPanel}
          pointWithPendingEdits={pointWithPendingEdits}
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
