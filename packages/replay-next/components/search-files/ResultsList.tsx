import {
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import Icon from "replay-next/components/Icon";
import {
  SourceSearchResult,
  StreamingSourceSearchResults,
  isSourceSearchResultLocation,
  searchCache,
} from "replay-next/src/suspense/SearchCache";
import { Source, sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import ResultsListRow from "./ResultsListRow";
import type { ItemData } from "./ResultsListRow";
import styles from "./ResultsList.module.css";

const ROW_HEIGHT = 18;

type CollapsedState = {
  collapsedResultIndices: Set<number>;
  collapsedRowCount: number;
};

export default function ResultsList({
  includeNodeModules,
  isPending,
  limit,
  query,
}: {
  includeNodeModules: boolean;
  isPending: boolean;
  limit?: number;
  query: string;
}) {
  const client = useContext(ReplayClientContext);

  if (query.trim() === "") {
    return null;
  }

  const streamingResults = searchCache.read(client, query, includeNodeModules, limit);
  const sources = sourcesCache.read(client);

  return (
    <StreamingResults
      isPending={isPending}
      query={query}
      sources={sources}
      streamingResults={streamingResults}
    />
  );
}

function StreamingResults({
  isPending,
  query,
  sources,
  streamingResults,
}: {
  isPending: boolean;
  query: string;
  sources: Source[];
  streamingResults: StreamingSourceSearchResults;
}) {
  const listRef = useRef<List>(null);
  const prevQueryRef = useRef<string>(query);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list !== null) {
      // Reset the scroll position when a new query is run.
      list.scrollToItem(0);
    }
  }, [query]);

  const [{ collapsedResultIndices, collapsedRowCount }, setCollapsedState] =
    useState<CollapsedState>({
      collapsedResultIndices: new Set(),
      collapsedRowCount: 0,
    });

  // Reset collapsed state when query changes.
  useEffect(() => {
    if (prevQueryRef.current != query) {
      prevQueryRef.current = query;

      setCollapsedState({
        collapsedResultIndices: new Set(),
        collapsedRowCount: 0,
      });
    }
  }, [query]);

  const isComplete = useSyncExternalStore(
    streamingResults.subscribe,
    () => streamingResults.complete,
    () => streamingResults.complete
  );

  const orderedResults = useSyncExternalStore<SourceSearchResult[]>(
    streamingResults.subscribe,
    () => streamingResults.orderedResults,
    () => streamingResults.orderedResults
  );

  const fetchedCount = useSyncExternalStore<number>(
    streamingResults.subscribe,
    () => streamingResults.fetchedCount,
    () => streamingResults.fetchedCount
  );

  const didOverflow = useSyncExternalStore<boolean>(
    streamingResults.subscribe,
    () => streamingResults.didOverflow,
    () => streamingResults.didOverflow
  );

  const getResultIndexFromRowIndex = useCallback(
    (rowIndex: number) => {
      let hiddenRowCount = 0;
      for (let loopIndex = 0; loopIndex < orderedResults.length; loopIndex++) {
        const resultIndex = loopIndex + hiddenRowCount;
        if (loopIndex === rowIndex) {
          return resultIndex;
        }

        // If this is a collapsed location, skip over the hidden matches
        const result = orderedResults[resultIndex];
        if (result == null) {
          console.error(`Unexpected null result at index ${resultIndex}`);
        }
        if (isSourceSearchResultLocation(result)) {
          const isCollapsed = collapsedResultIndices.has(resultIndex);
          if (isCollapsed) {
            hiddenRowCount += result.matchCount;
          }
        }
      }

      return null;
    },
    [collapsedResultIndices, orderedResults]
  );

  const getResultAtIndex = useCallback(
    (rowIndex: number) => {
      const resultIndex = getResultIndexFromRowIndex(rowIndex);
      if (resultIndex !== null) {
        return orderedResults[resultIndex] || null;
      }

      return null;
    },
    [getResultIndexFromRowIndex, orderedResults]
  );

  const isLocationCollapsed = useCallback(
    (rowIndex: number) => {
      const resultIndex = getResultIndexFromRowIndex(rowIndex);
      if (resultIndex !== null) {
        const result = orderedResults[resultIndex] || null;
        if (result != null && isSourceSearchResultLocation(result)) {
          return collapsedResultIndices.has(resultIndex);
        }
      }

      return false;
    },
    [collapsedResultIndices, getResultIndexFromRowIndex, orderedResults]
  );

  const toggleLocation = useCallback(
    (rowIndex: number, isOpen: boolean) => {
      setCollapsedState(prevCollapsedState => {
        const {
          collapsedResultIndices: prevCollapsedResultIndices,
          collapsedRowCount: prevCollapsedRowCount,
        } = prevCollapsedState;

        const resultsIndex = getResultIndexFromRowIndex(rowIndex);
        if (resultsIndex != null) {
          const prevIsOpen = !prevCollapsedResultIndices.has(resultsIndex);
          if (prevIsOpen !== isOpen) {
            const result = orderedResults[resultsIndex];
            if (result != null && isSourceSearchResultLocation(result)) {
              if (isOpen) {
                const nextCollapsedResultIndices = new Set(prevCollapsedResultIndices);
                nextCollapsedResultIndices.delete(resultsIndex);
                const nextCollapsedRowCount = prevCollapsedRowCount - result.matchCount;

                return {
                  collapsedResultIndices: nextCollapsedResultIndices,
                  collapsedRowCount: nextCollapsedRowCount,
                };
              } else {
                const nextCollapsedResultIndices = new Set(prevCollapsedResultIndices);
                nextCollapsedResultIndices.add(resultsIndex);
                const nextCollapsedRowCount = prevCollapsedRowCount + result.matchCount;

                return {
                  collapsedResultIndices: nextCollapsedResultIndices,
                  collapsedRowCount: nextCollapsedRowCount,
                };
              }
            }
          }
        }

        return prevCollapsedState;
      });
    },
    [orderedResults, getResultIndexFromRowIndex]
  );

  const itemData = useMemo<ItemData>(
    () => ({
      getResultAtIndex,
      isLocationCollapsed,
      query,
      sources,
      toggleLocation,
    }),
    [getResultAtIndex, isLocationCollapsed, query, sources, toggleLocation]
  );

  if (isComplete && orderedResults.length === 0) {
    return (
      <div className={styles.Results}>
        <div className={styles.NoResults}>No results found</div>
      </div>
    );
  }

  const style = {
    "--list-row-line-height": `${ROW_HEIGHT}px`,
  };

  const itemCount = orderedResults.length - collapsedRowCount;

  return (
    <div
      className={isPending ? styles.ResultsPending : styles.Results}
      data-test-id="SourceSearch-Results"
    >
      {didOverflow && (
        <div className={styles.OverflowHeader} data-test-id="SourceSearch-OverflowMessage">
          <Icon className={styles.OverflowIcon} type="warning" />
          The result set only contains a subset of all matches. Be more specific in your search to
          narrow down the results.
        </div>
      )}
      <div className={styles.List}>
        <AutoSizer
          children={({ height, width }) => (
            <List
              className={styles.List}
              height={height}
              itemCount={itemCount}
              itemData={itemData}
              itemSize={ROW_HEIGHT}
              ref={listRef}
              style={style as CSSProperties}
              width={width}
            >
              {ResultsListRow}
            </List>
          )}
        />
      </div>
    </div>
  );
}
