import styles from "./Loader.module.css";

export default function Loader({ className = "" }: { className?: string }) {
  return (
    <div className={`${className} ${styles.Loader}`} data-test-name="Loader">
      Loading…
    </div>
  );
}
