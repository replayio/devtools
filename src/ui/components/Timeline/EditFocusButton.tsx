import classNames from "classnames";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleFocusMode } from "ui/actions/timeline";
import { LoadingStatusWarning } from "ui/reducers/app";
import { getShowFocusModeControls } from "ui/reducers/timeline";

import Icon from "../shared/Icon";

import styles from "./EditFocusButton.module.css";

export const EditFocusButton = ({
  loadingStatusWarning,
}: {
  loadingStatusWarning: LoadingStatusWarning | null;
}) => {
  const dispatch = useDispatch();
  const showFocusModeControls = useSelector(getShowFocusModeControls);

  const onClick = () => {
    dispatch(toggleFocusMode());
  };

  return (
    <button
      className={
        showFocusModeControls
          ? styles.ToggleOn
          : loadingStatusWarning === "timed-out"
          ? styles.ToggleError
          : styles.ToggleOff
      }
      onClick={onClick}
      title={showFocusModeControls ? "Discard current focus" : "Start focus edit mode"}
    >
      <Icon
        className={
          showFocusModeControls
            ? styles.ToggleOnIcon
            : loadingStatusWarning === "timed-out"
            ? styles.ToggleErrorIcon
            : styles.ToggleOffIcon
        }
        filename="focus"
        size="extra-large"
      />
    </button>
  );
};
