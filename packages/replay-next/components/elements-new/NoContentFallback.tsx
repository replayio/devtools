import styles from "./NoContentFallback.module.css";

export function NoContentFallback() {
  return <div className={styles.Message}>Elements are not available</div>;
}
