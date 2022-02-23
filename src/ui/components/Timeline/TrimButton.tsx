import classNames from "classnames";
import React, { useState } from "react";
import { connect, ConnectedProps, useDispatch, useSelector } from "react-redux";
import * as actions from "ui/actions/app";
import { selectors } from "ui/reducers";
import { getIsTrimming } from "ui/reducers/app";
import { UIState } from "ui/state";
import MaterialIcon from "../shared/MaterialIcon";

export const TrimButton = () => {
  const dispatch = useDispatch();
  const isTrimming = useSelector(getIsTrimming);

  const onClick = () => {
    if (isTrimming) {
      dispatch(actions.hideModal());
    } else {
      dispatch(actions.setModal("trimming"));
    }
  };

  return (
    <button
      className={classNames(
        "h-6 w-6 rounded-full p-1",
        isTrimming ? "bg-primaryAccent  text-white" : "bg-white text-primaryAccent"
      )}
      onClick={onClick}
      title={isTrimming ? "Exit trimming mode" : "Enter trimming mode"}
    >
      <MaterialIcon>center_focus_strong</MaterialIcon>
    </button>
  );
};

const connector = connect(
  (state: UIState) => ({
    modal: selectors.getModal(state),
  }),
  {
    setModal: actions.setModal,
    hideModal: actions.hideModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(TrimButton);
