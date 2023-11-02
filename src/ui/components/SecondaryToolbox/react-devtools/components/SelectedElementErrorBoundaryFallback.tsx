import { ReactElement } from "ui/components/SecondaryToolbox/react-devtools/types";

import styles from "./SelectedElementErrorBoundaryFallback.module.css";

export function SelectedElementErrorBoundaryFallback({ element }: { element: ReactElement }) {
  return (
    <div className={styles.Panel}>
      <div className={styles.ComponentName}>{element.displayName}</div>
      <div className={styles.Section}>Could not load component details.</div>
    </div>
  );
}
