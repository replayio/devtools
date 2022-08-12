import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { CategoryCounts, getMessages } from "@bvaughn/src/suspense/MessagesCache";
import camelCase from "lodash/camelCase";
import React, { ReactNode, Suspense, useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Badge, Checkbox } from "design";

import EventsList from "./EventsList";
import styles from "./FilterToggles.module.css";
import { isInNodeModules } from "@bvaughn/src/utils/messages";

export default function FilterToggles() {
  const {
    showErrors,
    showExceptionsForDisplay: showExceptions,
    showLogs,
    showNodeModules,
    showTimestamps,
    showWarnings,
    update,
  } = useContext(ConsoleFiltersContext);

  return (
    <div className={styles.Filters} data-test-id="ConsoleFilterToggles">
      <Toggle
        checked={showExceptions}
        label="Exceptions"
        onChange={showExceptions => update({ showExceptions })}
      />
      <Toggle
        checked={showLogs}
        count={
          <Suspense fallback={null}>
            <ToggleCategoryCount category="logs" />
          </Suspense>
        }
        label="Logs"
        onChange={showLogs => update({ showLogs })}
      />
      <Toggle
        checked={showWarnings}
        count={
          <Suspense fallback={null}>
            <ToggleCategoryCount category="warnings" />
          </Suspense>
        }
        label="Warnings"
        onChange={showWarnings => update({ showWarnings })}
      />
      <Toggle
        checked={showErrors}
        count={
          <Suspense fallback={null}>
            <ToggleCategoryCount category="errors" />
          </Suspense>
        }
        label="Errors"
        onChange={showErrors => update({ showErrors })}
      />
      <hr className={styles.Divider} />
      <EventsList />
      <hr className={styles.Divider} />
      <Toggle
        checked={showNodeModules}
        count={<NodeModulesCount />}
        label="Node modules"
        onChange={showNodeModules => update({ showNodeModules })}
      />
      <Toggle
        checked={showTimestamps}
        label="Timestamps"
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
  count?: ReactNode | null;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const id = `FilterToggle-${camelCase(label)}`;
  return (
    <div className={styles.Filter}>
      <Checkbox
        data-test-id={id}
        label={label}
        checked={checked}
        id={id}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
      />
      {count}
    </div>
  );
}

function ToggleCategoryCount({ category }: { category: keyof CategoryCounts }) {
  const { range: focusRange } = useContext(FocusContext);
  const client = useContext(ReplayClientContext);

  const { categoryCounts } = getMessages(client, focusRange);
  const count = categoryCounts[category];

  return count === 0 ? null : <Badge label={count} />;
}

function NodeModulesCount() {
  const client = useContext(ReplayClientContext);
  const { range } = useContext(FocusContext);

  const { messages } = getMessages(client, range);

  const count = useMemo(() => {
    return messages.filter(message => isInNodeModules(message)).length;
  }, [messages]);

  return count === 0 ? null : <Badge label={count} />;
}
