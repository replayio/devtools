import { TestError as TestErrorType } from "shared/test-suites/types";
import Icon from "ui/components/shared/Icon";

import styles from "./TestError.module.css";

export function TestError({ error }: { error: TestErrorType }) {
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
