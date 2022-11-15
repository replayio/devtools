import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

import styles from "./ProgressBar.module.css";

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <CircularProgressbar
      className={styles.CircularProgressbar}
      strokeWidth={25}
      styles={buildStyles({
        pathColor: `var(--focus-mode-loaded-indexed-color)`,
        trailColor: `var(--chrome)`,
      })}
      value={progress}
    />
  );
}
