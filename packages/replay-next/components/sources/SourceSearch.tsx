import { ChangeEvent, KeyboardEvent, RefObject, useContext, useState } from "react";

import Icon from "../Icon";
import { SourceSearchContext } from "./SourceSearchContext";
import styles from "./SourceSearch.module.css";

export default function SourceSearch({
  containerRef,
  inputRef,
}: {
  containerRef: RefObject<HTMLElement>;
  inputRef: RefObject<HTMLInputElement>;
}) {
  const [searchState, searchActions] = useContext(SourceSearchContext);

  const { caseSensitive, regex, wholeWord } = searchState.modifiers;

  const [inputFocused, setInputFocused] = useState(false);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    searchActions.search(event.currentTarget.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
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
    const currentLabel = searchState.index < 0 ? "?" : searchState.index + 1;
    results = (
      <div className={styles.Results} data-test-id="SearchResultsLabel">
        {currentLabel} of {searchState.results.length} results
      </div>
    );
  } else if (searchState.query !== "") {
    results = <div className={styles.Results}>No results found</div>;
  }

  return (
    <div className={styles.Outer}>
      <div
        className={inputFocused ? styles.ContainerFocused : styles.Container}
        data-test-id="SourceSearch"
      >
        <div className={styles.InputAndResults}>
          <Icon className={styles.SearchIcon} type="search" />
          <input
            autoFocus
            className={styles.Input}
            data-test-id="SourceSearchInput"
            onBlur={() => setInputFocused(false)}
            onChange={onChange}
            onFocus={() => setInputFocused(true)}
            onKeyDown={onKeyDown}
            placeholder="Find"
            ref={inputRef}
            type="text"
            value={searchState.query}
          />
          {results}
          <button
            className={styles.ResultsIconButton}
            data-test-id="SourceSearchGoToPreviousButton"
            disabled={searchState.results.length === 0}
            onClick={searchActions.goToPrevious}
          >
            <Icon className={styles.ResultsIcon} type="up" />
          </button>
          <button
            className={styles.ResultsIconButton}
            data-test-id="SourceSearchGoToNextButton"
            disabled={searchState.results.length === 0}
            onClick={searchActions.goToNext}
          >
            <Icon className={styles.ResultsIcon} type="down" />
          </button>
        </div>
        <div className={styles.Modifiers}>
          Modifiers:
          <button
            className={[styles.ResultsIconButton, regex && styles.ResultsIconButtonActive].join(
              " "
            )}
            data-test-id="SearchRegExButton"
            onClick={() => searchActions.setModifiers({ ...searchState.modifiers, regex: !regex })}
          >
            .*
          </button>
          <button
            className={[
              styles.ResultsIconButton,
              caseSensitive && styles.ResultsIconButtonActive,
            ].join(" ")}
            data-test-id="SearchCaseSensitivityButton"
            onClick={() =>
              searchActions.setModifiers({
                ...searchState.modifiers,
                caseSensitive: !caseSensitive,
              })
            }
          >
            Aa
          </button>
          <button
            className={[styles.ResultsIconButton, wholeWord && styles.ResultsIconButtonActive].join(
              " "
            )}
            data-test-id="SearchWholeWordButtonButton"
            onClick={() =>
              searchActions.setModifiers({ ...searchState.modifiers, wholeWord: !wholeWord })
            }
          >
            <span className={styles.WholeWordText}>ab</span>
          </button>
        </div>
        <div className={styles.Modifiers}>
          <button
            className={styles.ResultsIconButton}
            data-test-id="SourceSearchClearButton"
            onClick={() => {
              searchActions.disable();

              const container = containerRef.current;
              if (container) {
                container.focus();
              }
            }}
          >
            <Icon className={styles.ResultsIcon} type="cancel" />
          </button>
        </div>
      </div>
    </div>
  );
}
