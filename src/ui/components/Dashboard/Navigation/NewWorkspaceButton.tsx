import React, { Dispatch, SetStateAction, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";

type NewWorkspaceButtonProps = PropsFromRedux & {
  setExpanded: Dispatch<SetStateAction<boolean>>;
};

function NewWorkspaceButton({ setExpanded, setModal }: NewWorkspaceButtonProps) {
  const onClick = () => {
    setExpanded(false);
    setModal("new-workspace");
  };

  return (
    <div className="create-new-workspace" onClick={onClick}>
      <div className="material-icons">add_circle</div>
      <div className="workspace-profile-content">
        <div className="title">Create Workspace</div>
        <div className="subtitle">Create a new workspace</div>
      </div>
    </div>
  );
}
const connector = connect(null, {
  setModal: actions.setModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NewWorkspaceButton);
