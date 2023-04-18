import { TestItemError } from "shared/graphql/types";
import Icon from "ui/components/shared/Icon";

import styles from "./TestError.module.css";

export function TestError({ error }: { error: TestItemError }) {
  return (
    <div className={styles.Row}>
      <div>
        <div className={styles.Header}>
          <Icon className={styles.Icon} filename="warning" size="small" />
          <span>Assertion Error</span>
        </div>
        <div className={styles.Error}>{error.message}</div>
      </div>
    </div>
  );
}
