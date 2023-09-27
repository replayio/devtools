import Icon from "replay-next/components/Icon";

import { CanonicalRequestType } from "./utils";
import styles from "./TestFilterRow.module.css";

export function TextFilterRow({
  filterByText,
  setFilterByText,
  setShowTypeFilters,
  showTypeFilters,
  types,
}: {
  filterByText: string;
  setFilterByText: (value: string) => void;
  setShowTypeFilters: (value: boolean) => void;
  showTypeFilters: boolean;
  types: Set<CanonicalRequestType>;
}) {
  return (
    <>
      <div className={styles.Row}>
        <button
          onClick={() => setShowTypeFilters(!showTypeFilters)}
          className={styles.FilterButton}
          data-test-id="Network-ToggleFilterByTypePanelButton"
          data-test-state={showTypeFilters ? "open" : "closed"}
        >
          <Icon className={styles.FilterIcon} type="filter" />
        </button>
        <label className={styles.SearchIconAndInput}>
          <Icon className={styles.SearchIcon} type="search" />

          <input
            className={styles.SearchInput}
            data-test-id="Network-TextFilterInput"
            onChange={event => setFilterByText(event.target.value)}
            placeholder="Filter requests"
            value={filterByText}
          />
        </label>
      </div>
    </>
  );
}
