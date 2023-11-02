import { PauseId } from "@replayio/protocol";
import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";

import Icon from "replay-next/components/Icon";
import { ReactDevToolsListData } from "ui/components/SecondaryToolbox/react-devtools/ReactDevToolsListData";
import { searchComponents } from "ui/components/SecondaryToolbox/react-devtools/utils/searchComponents";

import styles from "./Search.module.css";

export function Search({
  listData,
  pauseId,
}: {
  listData: ReactDevToolsListData | null;
  pauseId: PauseId | null;
}) {
  const [searchState, setSearchState] = useState<{
    index: number;
    matchingRows: number[];
    query: string;
  } | null>(null);
  const [query, setQuery] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  const onSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.currentTarget.value);
  };

  const onSearchInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (listData == null || pauseId == null) {
      return;
    }

    switch (event.key) {
      case "Enter": {
        event.preventDefault();
        event.stopPropagation();

        if (query === "") {
          setSearchState(null);
        } else if (searchState?.query === query) {
          if (searchState?.matchingRows.length > 0) {
            let index = searchState.index;
            if (event.shiftKey) {
              index = index > 0 ? index - 1 : searchState.matchingRows.length - 1;
            } else {
              index = index < searchState.matchingRows.length - 1 ? searchState.index + 1 : 0;
            }

            setSearchState({
              ...searchState,
              index,
            });

            const rowIndex = searchState.matchingRows[index];
            listData.setSelectedIndex(rowIndex);
          }
        } else {
          const matchingRows = searchComponents(listData, query);

          setSearchState({
            index: matchingRows.length > 0 ? 0 : -1,
            query,
            matchingRows,
          });

          if (matchingRows.length > 0) {
            const rowIndex = matchingRows[0];
            listData.setSelectedIndex(rowIndex);
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
    <>
      <label className={styles.SearchIconAndInput}>
        <Icon className={styles.SearchIcon} type="search" />
        <input
          className={styles.SearchInput}
          data-test-id="ReactSearchInput"
          disabled={listData == null || pauseId == null}
          onChange={onSearchInputChange}
          onKeyDown={onSearchInputKeyDown}
          placeholder="Search components"
          ref={searchInputRef}
          type="text"
          value={query}
        />
      </label>
      {searchState !== null && (
        <div className={styles.SearchResults}>
          {searchState.index + 1} of {searchState.matchingRows.length}
        </div>
      )}
    </>
  );
}
