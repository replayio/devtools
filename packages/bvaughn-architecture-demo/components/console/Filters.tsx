import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import React, { useContext } from "react";

import styles from "./Filters.module.css";

export default function Filters() {
  const { filterByDisplayText, levelFlags, update } = useContext(ConsoleFiltersContext);

  return (
    <>
      <div className={styles.FilterToggles}>
        <label className={styles.FilterLabel}>
          <input
            type="checkbox"
            checked={levelFlags.showLogs}
            onChange={event =>
              update(filterByDisplayText, { ...levelFlags, showLogs: event.currentTarget.checked })
            }
          />
          Logs?
        </label>
        <label className={styles.FilterLabel}>
          <input
            type="checkbox"
            checked={levelFlags.showWarnings}
            onChange={event =>
              update(filterByDisplayText, {
                ...levelFlags,
                showWarnings: event.currentTarget.checked,
              })
            }
          />
          Warnings?
        </label>
        <label className={styles.FilterLabel}>
          <input
            type="checkbox"
            checked={levelFlags.showErrors}
            onChange={event =>
              update(filterByDisplayText, {
                ...levelFlags,
                showErrors: event.currentTarget.checked,
              })
            }
          />
          Errors?
        </label>
      </div>
      <input
        className={styles.FilterInput}
        name="filter messages"
        value={filterByDisplayText}
        onChange={event => update(event.currentTarget.value, levelFlags)}
        placeholder="Filter output"
      />
    </>
  );
}
