import { HTMLProps } from "react";

import styles from "./TestSuitePanelMessage.module.css";

export function TestSuitePanelMessage({
  children,
  className,
  ...props
}: HTMLProps<HTMLDivElement>) {
  return (
    <div className={`${styles.panelMessage} ${className ?? ""}`} {...props}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
