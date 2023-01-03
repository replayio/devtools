import styles from "./IndeterminateLoader.module.css";

export default function IndeterminateLoader() {
  return (
    <div className={styles.Loader}>
      <div className={styles.ProgressBarOuter}>
        <div className={styles.ProgressBarInner} />
      </div>
      <div className={styles.LoadingLabel}>Loading...</div>
    </div>
  );
}
