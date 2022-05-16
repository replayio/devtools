import classNames from "classnames";
import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { useSelector } from "react-redux";
import { getLoadedAndIndexedProgress, getLoadingStatusSlow } from "ui/actions/app";
import { getShowFocusModeControls } from "ui/reducers/timeline";

import Icon from "../shared/Icon";

import styles from "./Capsule.module.css";
import { EditFocusButton } from "./EditFocusButton";
import FocusInputs from "./FocusInputs";

export default function Capsule({
  setShowLoadingProgress,
}: {
  setShowLoadingProgress: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const progress = Math.round(useSelector(getLoadedAndIndexedProgress) * 100);
  const loadingStatusSlow = useSelector(getLoadingStatusSlow);
  const showFocusModeControls = useSelector(getShowFocusModeControls);

  return (
    <div className={styles.Capsule}>
      <div
        className={
          showFocusModeControls || progress === 100 ? styles.LeftSideLoaded : styles.LeftSideLoading
        }
      >
        {showFocusModeControls || progress === 100 ? (
          <FocusInputs />
        ) : (
          <LoadingState
            loadingStatusSlow={loadingStatusSlow}
            progress={progress}
            setShowLoadingProgress={setShowLoadingProgress}
          />
        )}
      </div>
      <EditFocusButton />
    </div>
  );
}

function LoadingState({
  loadingStatusSlow,
  progress,
  setShowLoadingProgress,
}: {
  loadingStatusSlow: boolean;
  progress: number;
  setShowLoadingProgress: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const onMouseEnter = () => setShowLoadingProgress(true);
  const onMouseLeave = () => setShowLoadingProgress(false);

  return (
    <div className={styles.LoadingState} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {loadingStatusSlow ? (
        <Icon className={styles.SlowIcon} filename="turtle" size="extra-large" />
      ) : (
        <RadialProgress progress={progress} />
      )}
      <div className={styles.LoadingText}>{Math.round(progress)}%</div>
    </div>
  );
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
          pathColor: `var(--focus-mode-loaded-indexed-color)`,
          trailColor: `var(--focus-mode-loading-color)`,
        })}
        value={progress}
      />
    </div>
  );
}
