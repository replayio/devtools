import classNames from "classnames";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { useSelector } from "react-redux";
import { getIndexingProgress, getLoadingStatusWarning, LoadingStatusWarning } from "ui/actions/app";

import Icon from "../shared/Icon";

import styles from "./Capsule.module.css";
import { EditFocusButton } from "./EditFocusButton";
import FocusInputs from "./FocusInputs";

export default function Capsule() {
  const indexingProgress = useSelector(getIndexingProgress) || 0;
  const loadingStatusWarning = useSelector(getLoadingStatusWarning);

  return (
    <div className={styles.Capsule}>
      <div
        className={loadingStatusWarning === "timed-out" ? styles.LeftSideError : styles.LeftSide}
      >
        {indexingProgress < 100 ? (
          <LoadingState
            indexingProgress={indexingProgress}
            loadingStatusWarning={loadingStatusWarning}
          />
        ) : (
          <FocusInputs />
        )}
      </div>
      <EditFocusButton loadingStatusWarning={loadingStatusWarning} />
    </div>
  );
}

function LoadingState({
  indexingProgress,
  loadingStatusWarning,
}: {
  indexingProgress: number;
  loadingStatusWarning: LoadingStatusWarning | null;
}) {
  if (loadingStatusWarning === "timed-out") {
    return (
      <div className={styles.LoadingState}>
        <Icon className={styles.LoadingStateIcon} filename="cloud" size="large" />
        <div className={styles.LoadingText}>Error</div>
      </div>
    );
  } else {
    return (
      <div className={styles.LoadingState}>
        {loadingStatusWarning === "slow" ? (
          <Icon className={styles.LoadingStateIcon} filename="turtle" size="extra-large" />
        ) : (
          <RadialProgress progress={indexingProgress} />
        )}
        <div className={styles.LoadingText}>{Math.round(indexingProgress)}%</div>
      </div>
    );
  }
}

function RadialProgress({ className, progress }: { className?: string; progress: number }) {
  progress = Math.max(0, Math.min(100, progress));

  return (
    <div
      className={classNames(className, styles.RadialProgressContainer)}
      title={`${progress}% loaded`}
    >
      <CircularProgressbar
        className={styles.CircularProgressbar}
        strokeWidth={25}
        styles={buildStyles({
          pathColor: `var(--badge-color)`,
          trailColor: `var(--badge-background-color)`,
        })}
        value={progress}
      />
    </div>
  );
}
