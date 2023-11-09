import Loader from "replay-next/components/Loader";
import { LoadingProgressBar } from "replay-next/components/LoadingProgressBar";

import styles from "./PanelLoader.module.css";

export function PanelLoader() {
  return (
    <div className={styles.Wrapper}>
      <LoadingProgressBar />
      <Loader className={styles.Loader} />
    </div>
  );
}
