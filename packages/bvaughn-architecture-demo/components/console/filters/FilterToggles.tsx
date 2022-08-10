import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { CategoryCounts, getMessages } from "@bvaughn/src/suspense/MessagesCache";
import camelCase from "lodash/camelCase";
import React, { Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Badge, Checkbox } from "design";

import EventsList from "./EventsList";
import styles from "./FilterToggles.module.css";

export default function FilterToggles() {
  const {
    showErrors,
    showExceptions,
    showLogs,
    showNodeModules,
    showTimestamps,
    showWarnings,
    update,
  } = useContext(ConsoleFiltersContext);

  return (
    <div className={styles.Filters} data-test-id="ConsoleFilterToggles">
      <Toggle
        category="exceptions"
        checked={showExceptions}
        label="Exceptions"
        onChange={showExceptions => update({ showExceptions })}
      />
      <Toggle
        category="logs"
        checked={showLogs}
        label="Logs"
        onChange={showLogs => update({ showLogs })}
      />
      <Toggle
        category="warnings"
        checked={showWarnings}
        label="Warnings"
        onChange={showWarnings => update({ showWarnings })}
      />
      <Toggle
        category="errors"
        checked={showErrors}
        label="Errors"
        onChange={showErrors => update({ showErrors })}
      />
      <hr className={styles.Divider} />
      <EventsList />
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
  category = null,
  label,
  onChange,
}: {
  checked: boolean;
  category?: keyof CategoryCounts | null;
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
      {category && (
        <Suspense fallback={null}>
          <ToggleCategoryCount category={category} />
        </Suspense>
      )}
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
