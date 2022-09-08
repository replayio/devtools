import * as React from "react";

import styles from "./Badge.module.css";

export function Badge({ label }: { label: React.ReactNode }) {
  return <div className={styles.Root}>{label}</div>;
}
