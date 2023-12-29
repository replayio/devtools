import styles from "./TestEventDetails.module.css";

export function LoadingFailedMessage() {
  return (
    <div className={styles.Message} data-test-name="TestEventDetailsMessage">
      Unable to retrieve details for this step
    </div>
  );
}

export function LoadingInProgress() {
  return (
    <div className={styles.Message} data-test-name="TestEventDetailsMessage">
      Loading...
    </div>
  );
}
