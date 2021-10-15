import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import MaterialIcon from "../shared/MaterialIcon";

function TrimButton({ setModal, hideModal, modal }: PropsFromRedux) {
  const onClick = () => {
    if (modal === "trimming") {
      hideModal();
    } else {
      setModal("trimming");
    }
  };

  return (
    <button className="text-white rounded-full bg-primaryAccent w-6 h-6 p-1" onClick={onClick}>
      <MaterialIcon style={{ fontSize: "1rem" }}>center_focus_strong</MaterialIcon>
    </button>
  );
}

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
