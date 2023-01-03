import styles from "./SourceLineLoadingPlaceholder.module.css";

export default function SourceLineLoadingPlaceholder({ width }: { width: number }) {
  return (
    <div className={styles.Shimmer} style={{ width: `${width}ch` }}>
      &nbsp;
    </div>
  );
}
