import React from "react";

import { seekToTime } from "ui/actions/timeline";
import { getSelectedStep } from "ui/reducers/reporter";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import styles from "./CypressToggler.module.css";

export function CypressToggler() {
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();
  const selectedStep = useAppSelector(getSelectedStep);

  if (!selectedStep || selectedStep.startTime === selectedStep.endTime) {
    return null;
  }

  const onBefore = () => {
    dispatch(seekToTime(selectedStep.startTime));
  };
  const onAfter = () => {
    dispatch(seekToTime(selectedStep.endTime));
  };

  return (
    <div className={styles.ToggleWrapper}>
      <div className={styles.ToggleContainer}>
        <Button onClick={onBefore} active={currentTime === selectedStep.startTime}>
          Before
        </Button>
        <Button onClick={onAfter} active={currentTime === selectedStep.endTime}>
          After
        </Button>
      </div>
    </div>
  );
}

function Button({
  children,
  active,
  onClick,
}: {
  children: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button className={`${styles.ToggleButton} ${active ? styles.Active : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}
