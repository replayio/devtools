import classNames from "classnames";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { useSelector } from "react-redux";
import { getIndexingProgress } from "ui/actions/app";

import Icon from "../shared/Icon";

import styles from "./Capsule.module.css";
import { EditFocusButton } from "./EditFocusButton";
import FocusInputs from "./FocusInputs";

export default function Capsule() {
  const indexingProgress = useSelector(getIndexingProgress) || 0;

  // TODO [bvaughn] Determine when things have errored and we should show the storm cloud icon.
  // There is currently no explicit event for this case; should we add some sort of timeout?
  const didLoadingFail = false;

  return (
    <div className={styles.Capsule}>
      <div className={didLoadingFail ? styles.LeftSideError : styles.LeftSide}>
        {indexingProgress < 100 ? (
          <LoadingState indexingProgress={indexingProgress} didLoadingFail={didLoadingFail} />
        ) : (
          <FocusInputs />
        )}
      </div>
      <EditFocusButton didLoadingFail={didLoadingFail} />
    </div>
  );
}

function LoadingState({
  indexingProgress,
  didLoadingFail,
}: {
  indexingProgress: number;
  didLoadingFail: boolean;
}) {
  if (didLoadingFail) {
    return (
      <div className={styles.LoadingState}>
        <Icon className={styles.LoadingStateIcon} filename="cloud" size="large" />
        <div className={styles.LoadingText}>Error</div>
      </div>
    );
  } else {
    // Note that we render both UI elements; CSS hover state determines visibility.
    return (
      <div className={styles.LoadingState}>
        <Icon
          className={classNames(styles.LoadingStateIcon, styles.ShowOnHover)}
          filename="turtle"
          size="extra-large"
        />
        <RadialProgress className={styles.HideOnHover} progress={indexingProgress} />
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
