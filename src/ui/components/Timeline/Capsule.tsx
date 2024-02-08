import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

import ExternalLink from "replay-next/components/ExternalLink";
import { useIndexingProgress } from "replay-next/src/hooks/useIndexingProgress";
import { useLoadingIsSlow } from "ui/components/Timeline/useLoadingIsSlow";
import useModalDismissSignal from "ui/hooks/useModalDismissSignal";
import { getShowFocusModeControls } from "ui/reducers/timeline";
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
  const progress = useIndexingProgress();

  const showFocusModeControls = useAppSelector(getShowFocusModeControls);

  return (
    <div className={styles.Capsule} data-test-id="Timeline-Capsule" data-test-progress={progress}>
      <div
        className={
          showFocusModeControls || progress === 100 ? styles.LeftSideLoaded : styles.LeftSideLoading
        }
      >
        {showFocusModeControls || progress === 100 ? (
          <FocusInputs />
        ) : (
          <LoadingState progress={progress} setShowLoadingProgress={setShowLoadingProgress} />
        )}
      </div>
      <EditFocusButton />
    </div>
  );
}

function LoadingState({
  progress,
  setShowLoadingProgress,
}: {
  progress: number;
  setShowLoadingProgress: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const onMouseEnter = () => setShowLoadingProgress(true);
  const onMouseLeave = () => setShowLoadingProgress(false);

  const loadingIsSlow = useLoadingIsSlow();

  return (
    <>
      <div className={styles.LoadingState} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {loadingIsSlow ? <SlowLoadingIcon /> : <RadialProgress progress={progress} />}
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
