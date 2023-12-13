import styles from "./TestSuitePanelMessage.module.css";

export function TestSuitePanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-2">
      <div className={styles.standardMessaging}>{children}</div>
    </div>
  );
}
