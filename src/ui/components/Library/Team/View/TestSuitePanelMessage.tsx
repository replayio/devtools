import styles from "./TestSuitePanelMessage.module.css";

export function TestSuitePanelMessage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.panelMessage} ${className ?? ""}`}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
