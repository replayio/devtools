import classNames from "classnames";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

import { getLoadedAndIndexedProgress, getLoadingStatusSlow } from "ui/actions/app";
import ExternalLink from "ui/components/shared/ExternalLink";
import { useFeature } from "ui/hooks/settings";
import useModalDismissSignal from "ui/hooks/useModalDismissSignal";
import { getBasicProcessingProgress, getShowFocusModeControls } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

import Icon from "../shared/Icon";
import { EditFocusButton } from "./EditFocusButton";
import FocusInputs from "./FocusInputs";
import styles from "./Capsule.module.css";

const SHOW_SLOW_LOADING_POP_OUT_AFTER_DELAY = 1000;

export default function Capsule({
  setShowLoadingProgress,
}: {
  setShowLoadingProgress: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const indexingProgress = Math.round(useAppSelector(getLoadedAndIndexedProgress) * 100);
  const basicProcessingProgress = Math.round(useAppSelector(getBasicProcessingProgress) * 100);
  let progress = indexingProgress;
  const { value: basicProcessingLoadingBar } = useFeature("basicProcessingLoadingBar");

  if (basicProcessingLoadingBar) {
    progress = Math.round((basicProcessingProgress + indexingProgress) / 2);
  }
  const loadingStatusSlow = useAppSelector(getLoadingStatusSlow);
  const showFocusModeControls = useAppSelector(getShowFocusModeControls);

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
    <>
      <div className={styles.LoadingState} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {loadingStatusSlow ? <SlowLoadingIcon /> : <RadialProgress progress={progress} />}
        <div className={styles.LoadingText}>{Math.round(progress)}%</div>
      </div>
    </>
  );
}

function SlowLoadingIcon() {
  const ref = useRef<HTMLDivElement>(null);
  const [showSlowLoadingPopOut, setShowSlowLoadingPopOut] = useState<boolean>(false);

  useEffect(() => {
    const div = ref.current;
    if (!div) {
      return;
    }

    let timeoutID: NodeJS.Timeout | null = null;

    const showAfterTimeout = () => {
      timeoutID = setTimeout(() => {
        timeoutID = null;

        setShowSlowLoadingPopOut(true);
      }, SHOW_SLOW_LOADING_POP_OUT_AFTER_DELAY);
    };

    const clearPendingTimeout = () => {
      if (timeoutID !== null) {
        clearTimeout(timeoutID);
      }
    };

    div.addEventListener("click", clearPendingTimeout);
    div.addEventListener("mouseenter", showAfterTimeout);
    div.addEventListener("mouseleave", clearPendingTimeout);

    return () => {
      clearPendingTimeout();

      div.removeEventListener("click", clearPendingTimeout);
      div.removeEventListener("mouseenter", showAfterTimeout);
      div.removeEventListener("mouseleave", clearPendingTimeout);
    };
  }, []);

  return (
    <>
      <div ref={ref} onClick={() => setShowSlowLoadingPopOut(true)}>
        <Icon className={styles.SlowIcon} filename="turtle" size="extra-large" />
      </div>
      {showSlowLoadingPopOut && (
        <SlowLoadingPopOut dismiss={() => setShowSlowLoadingPopOut(false)} />
      )}
    </>
  );
}

function SlowLoadingPopOut({ dismiss }: { dismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useModalDismissSignal(ref, dismiss);

  return (
    <div ref={ref} className={styles.SlowLoadingPopOut}>
      Please{" "}
      <ExternalLink
        className={styles.SlowLoadingLink}
        href="https://discord.gg/n2dTK6kcRX"
        onClick={dismiss}
      >
        let us know
      </ExternalLink>{" "}
      if there is a problem.
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
