import styles from "./SearchResultHighlight.module.css";

export default function SearchResultHighlight({
  columnIndex,
  isActive,
  text,
}: {
  columnIndex: number;
  isActive: boolean;
  text: string;
}) {
  return (
    <pre className={styles.Highlight}>
      <span
        className={isActive ? styles.ActiveMark : styles.InactiveMark}
        style={{
          marginLeft: `${columnIndex + 1}ch`,
        }}
      >
        {text}
      </span>
    </pre>
  );
}
