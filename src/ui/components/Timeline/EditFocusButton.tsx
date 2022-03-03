import classNames from "classnames";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "ui/actions/app";
import { useFeature } from "ui/hooks/settings";
import { getIsFocusing } from "ui/reducers/app";
import { trackEvent } from "ui/utils/telemetry";
import MaterialIcon from "../shared/MaterialIcon";

export const EditFocusButton = () => {
  const dispatch = useDispatch();
  const isFocusing = useSelector(getIsFocusing);

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
        "flex",
        isFocusing ? "text-primaryAccent" : "text-themeToolbarPanelIconColor"
      )}
      onClick={onClick}
      title={isFocusing ? "Save current focus" : "Start focus edit mode"}
    >
      <MaterialIcon iconSize="2xl">center_focus_strong</MaterialIcon>
    </button>
  );
};
