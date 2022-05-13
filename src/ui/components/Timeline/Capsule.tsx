import classNames from "classnames";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { useSelector } from "react-redux";
import {
  getLoadedAndIndexedProgress,
  getLoadingStatusWarning,
  LoadingStatusWarning,
} from "ui/actions/app";
import { getShowFocusModeControls } from "ui/reducers/timeline";

import Icon from "../shared/Icon";

import styles from "./Capsule.module.css";
import { EditFocusButton } from "./EditFocusButton";
import FocusInputs from "./FocusInputs";

export default function Capsule() {
  const progress = Math.round(useSelector(getLoadedAndIndexedProgress) * 100);
  const loadingStatusWarning = useSelector(getLoadingStatusWarning);
  const showFocusModeControls = useSelector(getShowFocusModeControls);

  return (
    <div className={styles.Capsule}>
      <div
        className={
          showFocusModeControls || loadingStatusWarning !== "timed-out"
            ? styles.LeftSide
            : styles.LeftSideError
        }
      >
        {showFocusModeControls || progress === 100 ? (
          <FocusInputs />
        ) : (
          <LoadingState loadingStatusWarning={loadingStatusWarning} progress={progress} />
        )}
      </div>
      <EditFocusButton loadingStatusWarning={loadingStatusWarning} />
    </div>
  );
}

function LoadingState({
  loadingStatusWarning,
  progress,
}: {
  loadingStatusWarning: LoadingStatusWarning | null;
  progress: number;
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
          <RadialProgress progress={progress} />
        )}
        <div className={styles.LoadingText}>{Math.round(progress)}%</div>
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
