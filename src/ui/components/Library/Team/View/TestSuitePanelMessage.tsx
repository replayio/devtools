import styles from "./TestSuitePanelMessage.module.css";

export function TestSuitePanelMessage({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [x: string]: unknown;
}) {
  return (
    <div className={`${styles.panelMessage} ${className ?? ""}`} {...props}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
