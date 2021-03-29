import React from "react";
import Dashboard from "../Dashboard/index";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
const UserOptions = require("ui/components/Header/UserOptions").default;

function Header() {
  return (
    <div id="header">
      <div className="header-left">
        <div className="logo" />
        <div className="title-label">Replay</div>
      </div>
      <UserOptions mode="account" />
    </div>
  );
}

function Library({ setWorkspaceId }: PropsFromRedux) {
  const { personalWorkspaceId, loading } = hooks.useGetPersonalWorkspace();

  if (loading || !personalWorkspaceId) {
    return null;
  }

  setWorkspaceId(personalWorkspaceId);

  return (
    <>
      <Header />
      <Dashboard />
    </>
  );
}

const connector = connect(null, { setWorkspaceId: actions.setWorkspaceId });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Library);
