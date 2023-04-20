import { MutableRefObject, useContext, useState } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";

import Icon from "../Icon";
import { ConsoleSearchContext } from "./ConsoleSearchContext";
import styles from "./ConsoleSearch.module.css";

export default function ConsoleSearch({
  className,
  onHide,
  searchInputRef,
}: {
  className: string;
  onHide: () => void;
  searchInputRef: MutableRefObject<HTMLInputElement | null>;
}) {
  const [searchState, searchActions] = useContext(ConsoleSearchContext);
  const { trackEvent } = useContext(SessionContext);

  const [inputFocused, setInputFocused] = useState(false);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    trackEvent("console.search.start");
    searchActions.search(event.currentTarget.value);
  };

  const onClickHideButton = () => {
    searchActions.hide();
    onHide();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Escape": {
        event.preventDefault();
        searchActions.hide();
        onHide();
        break;
      }
      case "Enter":
      case "NumpadEnter": {
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
    const currentLabel = searchState.index < 0 ? "?" : searchState.index + 1;
    results = (
      <div className={styles.Results} data-test-id="SearchResultsLabel">
        {currentLabel} of {searchState.results.length} results
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
          onClick={onClickHideButton}
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
    <div
      className={`${inputFocused ? styles.ContainerFocused : styles.Container} ${className}`}
      data-test-id="ConsoleSearch"
    >
      <Icon className={styles.Icon} type="search" />
      <input
        autoFocus
        className={styles.Input}
        data-test-id="ConsoleSearchInput"
        onBlur={() => setInputFocused(false)}
        onChange={onChange}
        onFocus={() => setInputFocused(true)}
        onKeyDown={onKeyDown}
        placeholder="Find in logs"
        ref={searchInputRef}
        type="text"
        value={searchState.query}
      />

      {results}
    </div>
  );
}
