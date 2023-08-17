import { useMemo } from "react";

import styles from "./SourceLineLoadingPlaceholder.module.css";

export default function SourceLineLoadingPlaceholder() {
  const width = useMemo(() => Math.round(5 + Math.random() * 30), []);

  return (
    <div className={styles.Shimmer} style={{ width: `${width}ch` }}>
      &nbsp;
    </div>
  );
}
