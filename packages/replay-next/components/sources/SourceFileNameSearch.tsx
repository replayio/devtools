import { ChangeEvent, KeyboardEvent, RefObject, useContext, useEffect, useRef } from "react";

import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { getSourceFileName } from "replay-next/src/utils/source";
import { Nag } from "shared/graphql/types";

import Icon from "../Icon";
import { Result as SearchResult } from "./hooks/useSourceFileNameSearch";
import { SourceFileNameSearchContext } from "./SourceFileNameSearchContext";
import styles from "./SourceFileNameSearch.module.css";

export default function SourceFileNameSearch({
  containerRef,
  inputRef,
}: {
  containerRef: RefObject<HTMLElement>;
  inputRef: RefObject<HTMLInputElement>;
}) {
  const { openSource } = useContext(SourcesContext);

  const ref = useRef<HTMLDivElement>(null);

  const [searchState, searchActions] = useContext(SourceFileNameSearchContext);

  useEffect(() => {
    if (!searchState.enabled) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const self = ref.current;
      if (self) {
        if (!self.contains(event.target as Node)) {
          searchActions.search("");
          searchActions.disable();
        }
      }
    };

    document.body.addEventListener("click", onClick);
    return () => {
      document.body.removeEventListener("click", onClick);
    };
  }, [searchActions, searchState.enabled]);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.currentTarget.value;
    searchActions.search(text);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!searchState.enabled) {
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
      case "Enter":
      case "NumpadEnter": {
        event.preventDefault();

        if (searchState.goToLineNumber === null) {
          const result = searchState.results[searchState.index];
          if (result) {
            openSource("view-source", result.source.sourceId);
          }
        }

        searchActions.search("");
        searchActions.disable();
        break;
      }
      case "Escape": {
        event.preventDefault();

        searchActions.search("");
        searchActions.disable();

        const container = containerRef.current;
        if (container) {
          container.focus();
        }
        break;
      }
    }
  };

  let results = null;
  if (searchState.goToLineMode) {
    results = (
      <div className={styles.Results} data-test-id="SourceFileNameSearchResults">
        <div className={styles.Result}>
          <span className={styles.GoToLinePrefix}>Go to line</span>
          {searchState.goToLineNumber || ""}
        </div>
      </div>
    );
  } else if (searchState.results.length > 0) {
    results = (
      <div className={styles.Results} data-test-id="SourceFileNameSearchResults">
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
    <div className={styles.Popup} data-test-id="SourceFileNameSearch" ref={ref}>
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
