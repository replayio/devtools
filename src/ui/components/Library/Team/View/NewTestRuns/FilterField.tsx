import Icon from "replay-next/components/Icon";

import styles from "./TestRunsPage.module.css";

export const FilterField = ({
  onChange,
  placeholder,
  value,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className={styles.filterContainer}>
      <input
        className={styles.filterInput}
        data-test-id="TestRunsPage-FilterByText-Input"
        onChange={event => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      <Icon className={styles.searchIcon} type="search" />
    </div>
  );
};
