import styles from "./NoContentFallback.module.css";

export function NoContentFallback() {
  return (
    <div className={styles.Message} data-test-id="Elements-NotAvailable">
      Elements are not available
    </div>
  );
}
