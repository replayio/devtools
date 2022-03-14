import classNames from "classnames";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "ui/actions/app";
import { getIsFocusing } from "ui/reducers/app";
import { getIsInFocusMode } from "ui/reducers/timeline";
import { trackEvent } from "ui/utils/telemetry";
import MaterialIcon from "../shared/MaterialIcon";

export const EditFocusButton = () => {
  const dispatch = useDispatch();
  const isFocusing = useSelector(getIsFocusing);
  const isInFocusMode = useSelector(getIsInFocusMode);

  const onClick = () => {
    if (isFocusing) {
      trackEvent("timeline.exit_focus_edit");
      dispatch(actions.hideModal());
    } else {
      trackEvent("timeline.start_focus_edit");
      dispatch(actions.setModal("focusing"));
    }
  };

  return (
    <button
      className={classNames(
        "flex h-6 w-6 items-center justify-center rounded-full text-white",
        isInFocusMode ? "bg-primaryAccent" : "bg-themeToggleBgcolor"
      )}
      onClick={onClick}
      title={isFocusing ? "Save current focus" : "Start focus edit mode"}
    >
      <MaterialIcon iconSize="lg">center_focus_strong</MaterialIcon>
    </button>
  );
};
