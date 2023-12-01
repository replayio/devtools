import assert from "assert";
import { ObjectId, PauseId } from "@replayio/protocol";
import {
  ChangeEvent,
  KeyboardEvent,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import AutoSizer from "react-virtualized-auto-sizer";

import { ElementsList, ImperativeHandle } from "replay-next/components/elements-new/ElementsList";
import { ElementsListData } from "replay-next/components/elements-new/ElementsListData";
import { domSearchCache } from "replay-next/components/elements/suspense/DOMSearchCache";
import Icon from "replay-next/components/Icon";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./ElementsPanel.module.css";

export function ElementsPanel({
  listRefSetter,
  onSelectionChange,
  pauseId,
}: {
  listRefSetter: (ref: ImperativeHandle | null) => void;
  onSelectionChange?: (id: ObjectId | null) => void;
  pauseId: PauseId | null;
}) {
  const replayClient = useContext(ReplayClientContext);

  const listRef = useRef<ImperativeHandle | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const compositeListRef = useCallback(
    (ref: ImperativeHandle | null) => {
      listRef.current = ref;
      listRefSetter(ref);
    },
    [listRefSetter]
  );

  const listData = useMemo<ElementsListData | null>(
    () => (pauseId ? new ElementsListData(replayClient, pauseId) : null),
    [pauseId, replayClient]
  );

  const [searchInProgress, setSearchInProgress] = useState(false);
  const [searchState, setSearchState] = useState<{
    index: number;
    query: string;
    results: ObjectId[];
  } | null>(null);
  const [query, setQuery] = useState("");

  const onListKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "F":
      case "f": {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          event.stopPropagation();

          const input = searchInputRef.current;
          if (input) {
            input.focus();
          }
        }
        break;
      }
    }
  };

  const onSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.currentTarget.value);
  };

  const onSearchInputKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (pauseId == null) {
      return;
    }

    if (document.querySelector('[data-test-id="ElementsList"]') === null) {
      return;
    }

    switch (event.key) {
      case "Enter": {
        event.preventDefault();
        event.stopPropagation();

        assert(listData != null);

        if (query === "") {
          setSearchState(null);
        } else if (searchState?.query === query) {
          if (searchState.results.length === 0) {
            return;
          }

          let index = searchState.index;
          if (event.shiftKey) {
            index = index > 0 ? index - 1 : searchState.results.length - 1;
          } else {
            index = index < searchState.results.length - 1 ? searchState.index + 1 : 0;
          }

          setSearchState({
            ...searchState,
            index,
          });

          const list = listRef.current;
          if (list) {
            const id = searchState.results[index];
            list.selectNode(id);
          }
        } else {
          setSearchInProgress(true);

          let results = await domSearchCache.readAsync(replayClient, pauseId, query);

          // DOM search API may match on nodes that have been filtered (e.g. text nodes)
          // Refine the results list in memory to remove these matches.
          results = results.filter(id => listData.contains(id));

          setSearchInProgress(false);
          setSearchState({
            index: results.length > 0 ? 0 : -1,
            query,
            results,
          });

          if (results.length > 0) {
            const list = listRef.current;
            if (list) {
              const id = results[0];
              list.selectNode(id);
            }
          }
        }
        break;
      }
      case "Escape": {
        setQuery("");
        setSearchState(null);
        break;
      }
    }
  };

  return (
    <div className={styles.Panel}>
      <div className={styles.SearchRow}>
        <label className={styles.SearchIconAndInput}>
          <Icon className={styles.SearchIcon} type="search" />
          <input
            className={styles.SearchInput}
            data-search-in-progress={searchInProgress || undefined}
            data-test-id="ElementsSearchInput"
            disabled={listData == null || pauseId == null}
            onChange={onSearchInputChange}
            onKeyDown={onSearchInputKeyDown}
            placeholder="Search DOM"
            ref={searchInputRef}
            type="text"
            value={query}
          />
        </label>
        {searchState !== null && (
          <div className={styles.SearchResults} data-test-id="ElementsPanel-SearchResult">
            {searchState.index + 1} of {searchState.results.length}
          </div>
        )}
      </div>
      <div className={styles.ListRow} onKeyDown={onListKeyDown}>
        {listData && pauseId ? (
          <AutoSizer disableWidth>
            {({ height }: { height: number }) => (
              <Suspense
                fallback={<PanelLoader className={styles.PanelLoader} style={{ height }} />}
              >
                <ElementsList
                  height={height}
                  forwardedRef={compositeListRef}
                  key={pauseId}
                  listData={listData}
                  onSelectionChange={onSelectionChange}
                  pauseId={pauseId}
                />
              </Suspense>
            )}
          </AutoSizer>
        ) : (
          <PanelLoader className={styles.PanelLoader} />
        )}
      </div>
    </div>
  );
}
