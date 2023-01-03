import React, { useContext } from "react";

import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";

import styles from "./FilterText.module.css";

export default function FilterText() {
  const { filterByDisplayText, update } = useContext(ConsoleFiltersContext);

  return (
    <input
      className={styles.Input}
      data-test-id="ConsoleFilterInput"
      name="filter messages"
      value={filterByDisplayText}
      onChange={event => update({ filterByText: event.currentTarget.value })}
      placeholder="Filter output"
    />
  );
}
