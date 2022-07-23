import { useContext } from "react";

import Icon from "../Icon";

import styles from "./Search.module.css";
import { SearchContext } from "./SearchContext";

export default function Search({
  className,
  hideOnEscape,
}: {
  className: string;
  hideOnEscape: boolean;
}) {
  const [searchState, searchActions] = useContext(SearchContext);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    searchActions.search(event.currentTarget.value);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Escape": {
        if (hideOnEscape) {
          event.preventDefault();
          searchActions.hide();
        }
        break;
      }
      case "Enter": {
        event.preventDefault();
        if (event.shiftKey) {
          searchActions.goToPrevious();
        } else {
          searchActions.goToNext();
        }
        break;
      }
    }
  };

  if (!searchState.visible) {
    return null;
  }

  let results = null;
  if (searchState.results.length > 0) {
    results = (
      <div className={styles.Results} data-test-id="SearchResultsLabel">
        {searchState.index + 1} of {searchState.results.length} results
        <button
          className={styles.ResultsIconButton}
          data-test-id="ConsoleSearchGoToPreviousButton"
          onClick={searchActions.goToPrevious}
        >
          <Icon className={styles.ResultsIcon} type="up" />
        </button>
        <button
          className={styles.ResultsIconButton}
          data-test-id="ConsoleSearchGoToNextButton"
          onClick={searchActions.goToNext}
        >
          <Icon className={styles.ResultsIcon} type="down" />
        </button>
        <button
          className={styles.ResultsIconButton}
          data-test-id="ConsoleSearchClearButton"
          onClick={searchActions.hide}
        >
          <Icon className={styles.ResultsIcon} type="cancel" />
        </button>
      </div>
    );
  } else if (searchState.query !== "") {
    results = (
      <div className={styles.Results}>
        No results found
        <button className={styles.ResultsIconButton} onClick={searchActions.hide}>
          <Icon className={styles.ResultsIcon} type="cancel" />
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.Container} ${className}`} data-test-id="ConsoleSearch">
      <Icon className={styles.Icon} type="search" />
      <input
        autoFocus
        className={styles.Input}
        data-test-id="ConsoleSearchInput"
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Find in logs"
        type="text"
        value={searchState.query}
      />

      {results}
    </div>
  );
}
