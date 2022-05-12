import classNames from "classnames";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleFocusMode } from "ui/actions/timeline";
import { getIsFocusing } from "ui/reducers/app";
import { getIsInFocusMode } from "ui/reducers/timeline";
import MaterialIcon from "../shared/MaterialIcon";
import Icon from "../shared/Icon";

export const EditFocusButton = () => {
  const dispatch = useDispatch();
  const isFocusing = useSelector(getIsFocusing);
  const isInFocusMode = useSelector(getIsInFocusMode);

  const onClick = () => {
    dispatch(toggleFocusMode());
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
      <Icon filename="focus" className="mr-2" style={{ color: "white" }} />
    </button>
  );
};
