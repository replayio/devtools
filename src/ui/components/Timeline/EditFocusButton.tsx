import React from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { toggleFocusMode } from "ui/actions/timeline";
import { getShowFocusModeControls } from "ui/reducers/timeline";

import Icon from "../shared/Icon";

import styles from "./EditFocusButton.module.css";

export const EditFocusButton = () => {
  const dispatch = useAppDispatch();
  const showFocusModeControls = useAppSelector(getShowFocusModeControls);

  const onClick = () => {
    dispatch(toggleFocusMode());
  };

  return (
    <button
      className={showFocusModeControls ? styles.ToggleOn : styles.ToggleOff}
      data-test-id="EditFocusButton"
      data-test-state={showFocusModeControls ? "on" : "off"}
      onClick={onClick}
      title={showFocusModeControls ? "Discard current focus" : "Start focus edit mode"}
    >
      <Icon
        className={showFocusModeControls ? styles.ToggleOnIcon : styles.ToggleOffIcon}
        filename="focus"
        size="extra-large"
      />
    </button>
  );
};
