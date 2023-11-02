import { ReactNode } from "react";

import styles from "./Badge.module.css";

export function Badge({ children, title = children }: { children: string; title?: string }) {
  return (
    <span className={styles.Badge} title={title}>
      {children}
    </span>
  );
}
