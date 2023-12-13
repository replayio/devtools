import styles from "./TestSuitePanelMessage.module.css";

export function TestSuitePanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.panelMessage}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
