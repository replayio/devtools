import Loader from "replay-next/components/Loader";
import { ReactElement } from "ui/components/SecondaryToolbox/react-devtools/types";

import styles from "./SelectedElement.module.css";

// Looks like the SelectedElement panel to minimize layout jump when (re)loading between execution poitns
export function SelectedElementLoader({ element }: { element: ReactElement }) {
  const { displayName } = element;

  return (
    <div className={styles.Panel} data-is-pending>
      <div className={styles.TopRow}>
        <div className={styles.ComponentName}>{displayName}</div>
      </div>
      <div className={styles.Scrollable}>
        <Loader className={styles.Loader} />
      </div>
    </div>
  );
}
