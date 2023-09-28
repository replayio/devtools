import Icon from "replay-next/components/Icon";

import styles from "./ActionFilter.module.css";

export function ActionFilter({
  searchValue,
  onSearch,
}: {
  searchValue: string;
  onSearch: (value: string) => void;
}) {
  return (
    <div className={styles.SearchRow}>
      <label className={styles.SearchIconAndInput} id="redux-search">
        <Icon className={styles.SearchIcon} type="search" />
        <input
          autoComplete="off"
          className={styles.SearchInput}
          id="redux-searchbox"
          onChange={e => onSearch(e.target.value)}
          placeholder="Filter actions"
          type="text"
          value={searchValue}
        />
      </label>
    </div>
  );
}
