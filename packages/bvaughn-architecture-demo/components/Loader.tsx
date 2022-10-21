import styles from "./Loader.module.css";

export default function Loader() {
  return (
    <div className={styles.Loader} data-test-name="Loader">
      Loading…
    </div>
  );
}
