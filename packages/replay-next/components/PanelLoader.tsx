import { CSSProperties } from "react";

import Loader from "replay-next/components/Loader";
import { LoadingProgressBar } from "replay-next/components/LoadingProgressBar";

import styles from "./PanelLoader.module.css";

export function PanelLoader({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={`${styles.Wrapper} ${className}`} style={style}>
      <LoadingProgressBar />
      <Loader className={styles.Loader} />
    </div>
  );
}
