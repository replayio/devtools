import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

import styles from "./ProgressBar.module.css";

export function ProgressBar({ progress, error }: { progress: number; error: boolean }) {
  return (
    <CircularProgressbar
      className={styles.CircularProgressbar}
      strokeWidth={20}
      styles={buildStyles({
        pathColor: error ? "rgb(239 68 68)" : `var(--focus-mode-loaded-indexed-color)`,
        trailColor: `var(--circular-progress-bar-trail-color)`,
      })}
      value={progress}
    />
  );
}
