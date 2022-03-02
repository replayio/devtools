import classNames from "classnames";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "ui/actions/app";
import { useFeature } from "ui/hooks/settings";
import { getIsFocusing } from "ui/reducers/app";
import MaterialIcon from "../shared/MaterialIcon";

export const EditFocusButton = () => {
  const dispatch = useDispatch();
  const isFocusing = useSelector(getIsFocusing);
  const { value: enableFocusing } = useFeature("focusing");

  const onClick = () => {
    if (isFocusing) {
      dispatch(actions.hideModal());
    } else {
      dispatch(actions.setModal("focusing"));
    }
  };

  if (!enableFocusing) {
    return null;
  }

  return (
    <button
      className={classNames(
        "flex",
        isFocusing ? "text-primaryAccent" : "text-themeToolbarPanelIconColor"
      )}
      onClick={onClick}
      title={isFocusing ? "Exit focusing mode" : "Enter focusing mode"}
    >
      <MaterialIcon iconSize="2xl">center_focus_strong</MaterialIcon>
    </button>
  );
};
