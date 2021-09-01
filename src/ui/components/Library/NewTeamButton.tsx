import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import SidebarButton from "./SidebarButton";

function NewTeamButton({ setModal }: PropsFromRedux) {
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setModal("new-workspace");
  };

  return (
    <SidebarButton onClick={onClick} underline>
      Create new team
    </SidebarButton>
  );
}
const connector = connect(null, {
  setModal: actions.setModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NewTeamButton);
