import Loader from "@bvaughn/components/Loader";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import camelCase from "lodash/camelCase";
import React, { Suspense, useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isFirefoxInternalMessage } from "../utils/messages";

import EventsList from "./EventsList";
import styles from "./FilterToggles.module.css";

export default function FilterToggles() {
  const { range: focusRange } = useContext(FocusContext);
  const client = useContext(ReplayClientContext);
  const {
    showErrors,
    showExceptions,
    showLogs,
    showNodeModules,
    showTimestamps,
    showWarnings,
    update,
  } = useContext(ConsoleFiltersContext);

  const { messages } = getMessages(client, focusRange);
  const counts = useMemo(() => {
    let errors = 0;
    let exceptions = 0;
    let logs = 0;
    let warnings = 0;

    messages.forEach(message => {
      if (isFirefoxInternalMessage(message)) {
        return;
      }

      switch (message.level) {
        case "assert":
        case "info":
        case "trace":
          logs++;
          break;
        case "error":
          switch (message.source) {
            case "ConsoleAPI":
              errors++;
              break;
            case "PageError":
              exceptions++;
              break;
          }
          break;
        case "warning":
          warnings++;
          break;
      }
    });

    return { errors, exceptions, logs, warnings };
  }, [messages]);

  return (
    <div className={styles.Filters} data-test-id="ConsoleFilterToggles">
      <Toggle
        checked={showExceptions}
        count={counts.exceptions}
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
  const id = `FilterToggle-${camelCase(label)}`;
  return (
    <div className={styles.Filter}>
      <input
        className={styles.Checkbox}
        checked={checked}
        id={id}
        onChange={event => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <label className={styles.Label} data-test-id={id} htmlFor={id} title={label}>
        {label}
      </label>
      {count !== null && count > 0 && <div className={styles.Count}>{count}</div>}
    </div>
  );
}
