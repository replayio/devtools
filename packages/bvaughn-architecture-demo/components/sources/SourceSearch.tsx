import { ChangeEvent, KeyboardEvent, RefObject, useContext } from "react";

import Icon from "../Icon";

import styles from "./SourceSearch.module.css";
import { SourceSearchContext } from "./SourceSearchContext";

export default function SourceSearch({
  containerRef,
  inputRef,
}: {
  containerRef: RefObject<HTMLElement>;
  inputRef: RefObject<HTMLInputElement>;
}) {
  const [searchState, searchActions] = useContext(SourceSearchContext);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    searchActions.search(event.currentTarget.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Enter": {
        event.preventDefault();
        if (event.shiftKey) {
          searchActions.goToPrevious();
        } else {
          searchActions.goToNext();
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        searchActions.disable();

        const container = containerRef.current;
        if (container) {
          container.focus();
        }
        break;
      }
    }
  };

  if (!searchState.enabled) {
    return null;
  }

  let results = null;
  if (searchState.results.length > 0) {
    results = (
      <div className={styles.Results} data-test-id="SearchResultsLabel">
        {searchState.index + 1} of {searchState.results.length} results
        <button
          className={styles.ResultsIconButton}
          data-test-id="SourceSearchGoToPreviousButton"
          onClick={searchActions.goToPrevious}
        >
          <Icon className={styles.ResultsIcon} type="up" />
        </button>
        <button
          className={styles.ResultsIconButton}
          data-test-id="SourceSearchGoToNextButton"
          onClick={searchActions.goToNext}
        >
          <Icon className={styles.ResultsIcon} type="down" />
        </button>
        <button
          className={styles.ResultsIconButton}
          data-test-id="SourceSearchClearButton"
          onClick={searchActions.disable}
        >
          <Icon className={styles.ResultsIcon} type="cancel" />
        </button>
      </div>
    );
  } else if (searchState.query !== "") {
    results = (
      <div className={styles.Results}>
        No results found
        <button className={styles.ResultsIconButton} onClick={searchActions.disable}>
          <Icon className={styles.ResultsIcon} type="cancel" />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.Container} data-test-id="SourceSearch">
      <Icon className={styles.Icon} type="search" />
      <input
        autoFocus
        className={styles.Input}
        data-test-id="SourceSearchInput"
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Find"
        ref={inputRef}
        type="text"
        value={searchState.query}
      />

      {results}
    </div>
  );
}
