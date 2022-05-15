import classNames from "classnames";
import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { useDispatch, useSelector } from "react-redux";
import {
  getLoadedAndIndexedProgress,
  getLoadingStatusWarning,
  LoadingStatusWarning,
} from "ui/actions/app";
import { setModal } from "ui/reducers/app";
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
  const loadingStatusWarning = useSelector(getLoadingStatusWarning);
  const showFocusModeControls = useSelector(getShowFocusModeControls);

  return (
    <div className={styles.Capsule}>
      <div
        className={
          showFocusModeControls || progress === 100
            ? styles.LeftSideLoaded
            : loadingStatusWarning === "really-slow"
            ? styles.LeftSideReallySlow
            : styles.LeftSide
        }
      >
        {showFocusModeControls || progress === 100 ? (
          <FocusInputs />
        ) : (
          <LoadingState
            loadingStatusWarning={loadingStatusWarning}
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
  loadingStatusWarning,
  progress,
  setShowLoadingProgress,
}: {
  loadingStatusWarning: LoadingStatusWarning | null;
  progress: number;
  setShowLoadingProgress: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const dispatch = useDispatch();

  const onClick = () => {
    if (loadingStatusWarning === "really-slow") {
      dispatch(setModal("timeline-slow"));
    }
  };

  const onMouseEnter = () => setShowLoadingProgress(true);
  const onMouseLeave = () => setShowLoadingProgress(false);

  return (
    <div
      className={styles.LoadingState}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {loadingStatusWarning === "really-slow" ? (
        <Icon className={styles.ReallySlowIcon} filename="cloud" size="large" />
      ) : loadingStatusWarning === "slow" ? (
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
          pathColor: `var(--badge-color)`,
          trailColor: `var(--badge-background-color)`,
        })}
        value={progress}
      />
    </div>
  );
}
