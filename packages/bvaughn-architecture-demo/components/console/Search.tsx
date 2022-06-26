import { useContext } from "react";

import Icon from "../Icon";

import styles from "./Search.module.css";
import { SearchContext } from "./SearchContext";

export default function Search({ className }: { className: string }) {
  const [searchState, searchActions] = useContext(SearchContext);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    searchActions.search(event.currentTarget.value);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Escape": {
        event.preventDefault();
        searchActions.hide();
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

  return (
    <div className={`${styles.Container} ${className}`}>
      <Icon className={styles.Icon} type="search" />
      <input
        autoFocus
        className={styles.Input}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Find in logs"
        type="text"
        value={searchState.query}
      />

      {searchState.results.length > 0 && (
        <div className={styles.Results}>
          {searchState.index + 1} of {searchState.results.length} results
          <button className={styles.ResultsIconButton} onClick={searchActions.goToPrevious}>
            <Icon className={styles.ResultsIcon} type="up" />
          </button>
          <button className={styles.ResultsIconButton} onClick={searchActions.goToNext}>
            <Icon className={styles.ResultsIcon} type="down" />
          </button>
          <button className={styles.ResultsIconButton} onClick={searchActions.hide}>
            <Icon className={styles.ResultsIcon} type="cancel" />
          </button>
        </div>
      )}
    </div>
  );
}
