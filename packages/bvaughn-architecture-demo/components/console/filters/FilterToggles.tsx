import Loader from "@bvaughn/components/Loader";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import camelCase from "lodash/camelCase";
import React, { Suspense, useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import EventsList from "./EventsList";
import styles from "./FilterToggles.module.css";
import useFocusRange from "../hooks/useFocusRange";

export default function FilterToggles() {
  const focusRange = useFocusRange();
  const client = useContext(ReplayClientContext);
  const {
    showErrors,
    showExceptionsForDisplay: showExceptions,
    showLogs,
    showNodeModules,
    showTimestamps,
    showWarnings,
    update,
  } = useContext(ConsoleFiltersContext);

  const { messages } = getMessages(client, focusRange);
  const counts = useMemo(() => {
    let errors = 0;
    let logs = 0;
    let warnings = 0;

    messages.forEach(message => {
      switch (message.level) {
        case "assert":
        case "info":
        case "trace":
          logs++;
          break;
        case "error":
          errors++;
          break;
        case "warning":
          warnings++;
          break;
      }
    });

    return { errors, logs, warnings };
  }, [messages]);

  return (
    <div className={styles.Filters} data-test-id="ConsoleFilterToggles">
      <Toggle
        checked={showExceptions}
        label="Exceptions"
        onChange={showExceptions => update({ showExceptions })}
      />
      <Toggle
        checked={showLogs}
        count={counts.logs}
        label="Logs"
        onChange={showLogs => update({ showLogs })}
      />
      <Toggle
        checked={showWarnings}
        count={counts.warnings}
        label="Warnings"
        onChange={showWarnings => update({ showWarnings })}
      />
      <Toggle
        checked={showErrors}
        count={counts.errors}
        label="Errors"
        onChange={showErrors => update({ showErrors })}
      />
      <hr className={styles.Divider} />
      <Suspense fallback={<Loader />}>
        <EventsList />
      </Suspense>
      <hr className={styles.Divider} />
      <Toggle
        checked={!showNodeModules}
        label="Hide node modules"
        onChange={hideNodeModules => update({ showNodeModules: !hideNodeModules })}
      />
      <Toggle
        checked={showTimestamps}
        label="Show timestamps"
        onChange={showTimestamps => update({ showTimestamps })}
      />
    </div>
  );
}

function Toggle({
  checked,
  count = null,
  label,
  onChange,
}: {
  checked: boolean;
  count?: number | null;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={styles.Filter}>
      <label className={styles.Label} data-test-id={`FilterToggle-${camelCase(label)}`}>
        <input
          className={styles.Checkbox}
          checked={checked}
          onChange={event => onChange(event.currentTarget.checked)}
          type="checkbox"
        />
        {label}
      </label>
      {count !== null && count > 0 && <div className={styles.Count}>{count}</div>}
    </div>
  );
}
