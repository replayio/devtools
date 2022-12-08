import React from "react";

import { useTestStepActions } from "ui/hooks/useTestStepActions";
import { getSelectedStep } from "ui/reducers/reporter";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./CypressToggler.module.css";

export function CypressToggler() {
  const selectedStep = useAppSelector(getSelectedStep);
  const { isAtStepStart, isAtStepEnd, seekToStepEnd, seekToStepStart } =
    useTestStepActions(selectedStep);

  if (!selectedStep || (isAtStepStart && isAtStepEnd)) {
    return null;
  }

  return (
    <div className={styles.ToggleWrapper}>
      <div className={styles.ToggleContainer}>
        <Button onClick={seekToStepStart} active={isAtStepStart}>
          Before
        </Button>
        <Button onClick={seekToStepEnd} active={isAtStepEnd}>
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
