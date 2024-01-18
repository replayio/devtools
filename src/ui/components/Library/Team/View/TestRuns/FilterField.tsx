import Icon from "replay-next/components/Icon";

import styles from "./FilterField.module.css";

export const FilterField = ({
  className,
  onChange,
  placeholder,
  value,
  dataTestId,
}: {
  className?: string;
  placeholder: string;
  value: string;
  dataTestId: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className={`${styles.filterContainer} ${className ?? ""}`}>
      <input
        className={styles.filterInput}
        data-test-id={dataTestId}
        onChange={event => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      <Icon className={styles.searchIcon} type="search" />
    </div>
  );
};
