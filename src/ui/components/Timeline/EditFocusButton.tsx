import classNames from "classnames";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleFocusMode } from "ui/actions/timeline";
import { getShowFocusModeControls } from "ui/reducers/timeline";

import Icon from "../shared/Icon";

export const EditFocusButton = () => {
  const dispatch = useDispatch();
  const showFocusModeControls = useSelector(getShowFocusModeControls);

  const onClick = () => {
    dispatch(toggleFocusMode());
  };

  return (
    <button
      className={classNames(
        "flex h-6 w-6 items-center justify-center rounded-full text-white",
        showFocusModeControls ? "bg-primaryAccent" : "bg-themeToggleBgcolor"
      )}
      onClick={onClick}
      title={showFocusModeControls ? "Discard current focus" : "Start focus edit mode"}
    >
      <Icon
        filename="focus"
        className={classNames(
          showFocusModeControls ? "bg-current text-white" : "bg-themeToggleColor"
        )}
      />
    </button>
  );
};
