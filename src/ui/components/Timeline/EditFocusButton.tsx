import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleFocusMode } from "ui/actions/timeline";
import { getShowFocusModeControls } from "ui/reducers/timeline";

import Icon from "../shared/Icon";

import styles from "./EditFocusButton.module.css";

export const EditFocusButton = () => {
  const dispatch = useDispatch();
  const showFocusModeControls = useSelector(getShowFocusModeControls);

  const onClick = () => {
    dispatch(toggleFocusMode());
  };

  return (
    <button
      className={showFocusModeControls ? styles.ToggleOn : styles.ToggleOff}
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
