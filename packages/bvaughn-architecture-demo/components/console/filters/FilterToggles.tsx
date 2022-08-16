import Icon from "@bvaughn/components/Icon";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import {
  addTooManyPointsListeners,
  didExceptionsFailTooManyPoints,
} from "@bvaughn/src/suspense/ExceptionsCache";
import { isInNodeModules } from "@bvaughn/src/utils/messages";
import { CategoryCounts, getMessages } from "@bvaughn/src/suspense/MessagesCache";
import camelCase from "lodash/camelCase";
import React, { ReactNode, Suspense, useContext, useMemo, useSyncExternalStore } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Badge, Checkbox } from "design";

import EventsList from "./EventsList";
import styles from "./FilterToggles.module.css";

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

  const tooManyPoints = useSyncExternalStore(
    (callback: () => void) => addTooManyPointsListeners(callback),
    didExceptionsFailTooManyPoints,
    didExceptionsFailTooManyPoints
  );
  const showExceptionsErrorBadge = showExceptions && tooManyPoints;

  return (
    <div className={styles.Filters} data-test-id="ConsoleFilterToggles">
      <Toggle
        afterContent={
          showExceptionsErrorBadge ? (
            <span title="There are too many exceptions. Please focus to a smaller time range and try again.">
              <Icon className={styles.ExceptionsErrorIcon} type="warning" />
            </span>
          ) : null
        }
        checked={showExceptions}
        label="Exceptions"
        onChange={showExceptions => update({ showExceptions })}
      />
      <Toggle
        afterContent={
          <Suspense fallback={null}>
            <ToggleCategoryCount category="logs" />
          </Suspense>
        }
        checked={showLogs}
        label="Logs"
        onChange={showLogs => update({ showLogs })}
      />
      <Toggle
        afterContent={
          <Suspense fallback={null}>
            <ToggleCategoryCount category="warnings" />
          </Suspense>
        }
        checked={showWarnings}
        label="Warnings"
        onChange={showWarnings => update({ showWarnings })}
      />
      <Toggle
        afterContent={
          <Suspense fallback={null}>
            <ToggleCategoryCount category="errors" />
          </Suspense>
        }
        checked={showErrors}
        label="Errors"
        onChange={showErrors => update({ showErrors })}
      />
      <hr className={styles.Divider} />
      <EventsList />
      <hr className={styles.Divider} />
      <Toggle
        afterContent={<NodeModulesCount />}
        checked={showNodeModules}
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
  afterContent = null,
  checked,
  label,
  onChange,
}: {
  afterContent?: ReactNode | null;
  checked: boolean;
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
      {afterContent}
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
