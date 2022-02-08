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
    <button className="h-6 w-6 rounded-full bg-primaryAccent p-1 text-white" onClick={onClick}>
      <MaterialIcon>center_focus_strong</MaterialIcon>
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
