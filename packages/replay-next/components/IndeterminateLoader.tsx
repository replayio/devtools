import styles from "./IndeterminateLoader.module.css";

export function IndeterminateProgressBar() {
  return (
    <div className={styles.ProgressBarOuter}>
      <div className={styles.ProgressBarInner} />
    </div>
  );
}

export default function IndeterminateLoader() {
  return (
    <div className={styles.Loader} data-test-id="indeterminate-loader">
      <IndeterminateProgressBar />
      <div className={styles.LoadingLabel}>Loading...</div>
    </div>
  );
}
