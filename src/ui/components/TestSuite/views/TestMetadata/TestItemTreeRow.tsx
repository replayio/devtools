import { CSSProperties, useTransition } from "react";

import MaterialIcon from "ui/components/shared/MaterialIcon";
import { TestResultIcon } from "ui/components/TestSuite/components/TestResultIcon";
import { ProcessedTestItem } from "ui/components/TestSuite/types";

import styles from "./TestItemTreeRow.module.css";

export default function TestItemTreeRow({
  onClick: onClickProp,
  testItem,
}: {
  onClick: () => void;
  testItem: ProcessedTestItem;
}) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => startTransition(onClickProp);

  const { error, result, scopePath, title } = testItem;

  return (
    <li className={styles.Row} data-is-pending={isPending || undefined} onClick={onClick}>
      <TestResultIcon result={result} />
      <div className={styles.Column}>
        <div className={styles.Title}>{title}</div>
        {error && (
          <div className={styles.Error}>
            <span className={styles.ErrorTitle}>Error:</span> {error.message}
          </div>
        )}
      </div>
      <MaterialIcon className={styles.Chevron}>chevron_right</MaterialIcon>
    </li>
  );
}
