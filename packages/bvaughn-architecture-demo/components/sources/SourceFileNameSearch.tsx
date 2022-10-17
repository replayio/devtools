import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import { getSourceFileName } from "@bvaughn/src/utils/source";
import { ChangeEvent, KeyboardEvent, RefObject, useContext } from "react";

import Icon from "../Icon";

import { Result as SearchResult } from "./hooks/useSourceFileNameSearch";
import styles from "./SourceFileNameSearch.module.css";
import { SourceFileNameSearchContext } from "./SourceFileNameSearchContext";

export default function SourceFileNameSearch({
  inputRef,
}: {
  inputRef: RefObject<HTMLInputElement>;
}) {
  const { openSource } = useContext(SourcesContext);

  const [searchState, searchActions] = useContext(SourceFileNameSearchContext);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.currentTarget.value;
    searchActions.search(text);
  };

  const query = searchState.query;
  const goToLineMode = query.startsWith(":");

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!searchState.visible) {
      return;
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        searchActions.goToNext();
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        searchActions.goToPrevious();
        break;
      }
      case "Enter": {
        event.preventDefault();

        if (!goToLineMode) {
          const result = searchState.results[searchState.index];
          if (result) {
            openSource(result.source.sourceId);
          }
        }

        searchActions.search("");
        searchActions.hide();
        break;
      }
      case "Escape": {
        event.preventDefault();
        searchActions.hide();
        break;
      }
    }
  };

  let results = null;
  if (!goToLineMode && searchState.results.length > 0) {
    results = (
      <div className={styles.Result}>
        {searchState.results.map((result, index) => (
          <Result
            key={result.source.sourceId}
            isFocused={index === searchState.index}
            result={result}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.Popup} data-test-id="SourceFileNameSearch">
      <div className={styles.TopRow}>
        <Icon className={styles.Icon} type="search" />
        <input
          autoFocus
          className={styles.Input}
          data-test-id="SourceFileNameSearchInput"
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Go to file..."
          ref={inputRef}
          type="text"
          value={searchState.query}
        />
      </div>

      {results}
    </div>
  );
}

function Result({ isFocused, result }: { isFocused: boolean; result: SearchResult }) {
  const { characterIndices, source } = result;

  const fileName = getSourceFileName(source, true)!;

  let html = "";
  let currentIndex = 0;
  characterIndices.forEach(index => {
    html += fileName.substring(currentIndex, index);
    html += `<strong>${fileName?.charAt(index)}</strong>`;
    currentIndex = index + 1;
  });
  html += fileName.substring(currentIndex);

  return (
    <div className={isFocused ? styles.ResultFocused : styles.Result}>
      <Icon className={styles.ResultIcon} type="file" />
      <span className={styles.ResultFileName} dangerouslySetInnerHTML={{ __html: html }} />
      <span className={styles.ResultURL}>{source.url || ""}</span>
    </div>
  );
}
