import assert from "assert";
import { ObjectId, PauseId } from "@replayio/protocol";
import {
  ChangeEvent,
  KeyboardEvent,
  Suspense,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AutoSizer from "react-virtualized-auto-sizer";

import { ElementsList, ImperativeHandle } from "replay-next/components/elements/ElementsList";
import { ElementsListData } from "replay-next/components/elements/ElementsListData";
import { domSearchCache } from "replay-next/components/elements/suspense/DOMSearchCache";
import Icon from "replay-next/components/Icon";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import useLocalStorageUserData from "shared/user-data/LocalStorage/useLocalStorageUserData";

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

  const [advancedSearch, setAdvancedSearch] = useLocalStorageUserData(
    "elementsPanelAdvancedSearch"
  );
  const [searchInProgress, setSearchInProgress] = useState(false);
  const [searchState, setSearchState] = useState<{
    advanced: boolean;
    index: number;
    indices: number[];
    query: string;
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

  const runSearch = async () => {
    if (listData == null || pauseId == null) {
      return;
    }

    let indices: number[];

    setSearchInProgress(true);

    if (!advancedSearch) {
      await listData.waitUntilLoaded();

      // Basic search is an in-memory, what-you-see search
      indices = listData.search(query);
    } else {
      // Advanced search uses the protocol API and mirrors Chrome's element search
      let ids = await domSearchCache.readAsync(replayClient, pauseId, query);

      indices = [];

      ids.forEach(id => {
        // DOM search API may match on nodes that are not displayed locally
        if (listData.contains(id)) {
          indices.push(listData.getIndexForItemId(id));
        }
      });
    }

    setSearchInProgress(false);
    setSearchState({
      advanced: advancedSearch,
      index: indices.length > 0 ? 0 : -1,
      indices,
      query,
    });

    if (indices.length > 0) {
      const list = listRef.current;
      if (list) {
        const index = indices[0];
        list.selectIndex(index);
      }
    }
  };

  const prevPauseIdRef = useRef<PauseId | null>(pauseId);
  useLayoutEffect(() => {
    const prevPauseId = prevPauseIdRef.current;
    prevPauseIdRef.current = pauseId;

    if (prevPauseId !== pauseId && !searchInProgress && query) {
      runSearch();
    }
  });

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
        } else if (searchState?.advanced !== advancedSearch || searchState?.query !== query) {
          runSearch();
        } else {
          if (searchState.indices.length === 0) {
            return;
          }

          let index = searchState.index;
          if (event.shiftKey) {
            index = index > 0 ? index - 1 : searchState.indices.length - 1;
          } else {
            index = index < searchState.indices.length - 1 ? searchState.index + 1 : 0;
          }

          setSearchState({
            ...searchState,
            index,
          });

          const list = listRef.current;
          if (list) {
            const newIndex = searchState.indices[index];
            list.selectIndex(newIndex);
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

  const onAdvancedSearchButtonClick = () => {
    setAdvancedSearch(!advancedSearch);
    searchInputRef.current?.focus();

    // Don't automatically re-run the search yet, because state hasn't updated.
    // We don't really know the user's intent either,
    // So just set focus on the search input and let the user trigger the search when they're ready.
  };

  let searchResultsText = "";
  if (!searchInProgress && searchState !== null) {
    searchResultsText = `${searchState.index + 1} of ${searchState.indices.length}`;
  }

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
        <button
          className={styles.AdvancedButton}
          data-active={advancedSearch || undefined}
          data-test-id="ElementsPanel-AdvancedSearchButton"
          onClick={onAdvancedSearchButtonClick}
          title="Advanced search"
        >
          <Icon className={styles.AdvancedIcon} type="advanced" />
        </button>
        {searchInProgress && (
          <Icon
            className={styles.SpinnerIcon}
            data-test-id="ElementsPanel-Searching"
            type="spinner"
          />
        )}
        {!searchInProgress && searchState !== null && (
          <div
            className={styles.SearchResults}
            data-test-id="ElementsPanel-SearchResult"
            title={searchResultsText}
          >
            {searchResultsText}
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
