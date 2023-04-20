import { ReactNode } from "react";

import styles from "./Badge.module.css";

export function Badge({
  label,
  showErrorBadge = false,
}: {
  label: ReactNode;
  showErrorBadge?: boolean;
}) {
  return (
    <div className={styles.Badge} data-error={showErrorBadge || undefined}>
      {label}
    </div>
  );
}
