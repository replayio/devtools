import { ReactNode } from "react";

import styles from "./IndeterminateLoader.module.css";

export function IndeterminateProgressBar() {
  return (
    <div className={styles.ProgressBarOuter}>
      <div className={styles.ProgressBarInner} />
    </div>
  );
}

export default function IndeterminateLoader({ message = "Loading..." }: { message?: ReactNode }) {
  return (
    <div className={styles.Loader} data-testid="indeterminate-loader">
      <IndeterminateProgressBar />
      <div className={styles.LoadingLabel}>{message}</div>
    </div>
  );
}
