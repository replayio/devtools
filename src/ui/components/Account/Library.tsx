import React from "react";
import Dashboard from "../Dashboard/index";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
const UserOptions = require("ui/components/Header/UserOptions").default;
import FullScreenInfo from "./FullScreenInfo";

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
  const { personalWorkspaceId, loading: workspaceLoading } = hooks.useGetPersonalWorkspace();
  const { recordingsCount, loading: recordingsLoading } = hooks.useGetAuthoredRecordings();

  if (recordingsLoading || workspaceLoading || !personalWorkspaceId || !recordingsCount) {
    return null;
  }

  setWorkspaceId(personalWorkspaceId);

  if (recordingsCount == 0) {
    return (
      <FullScreenInfo header="All set">
        <>
          <p>{`Let's record your first Replay.`}</p>
          <ol style={{ marginLeft: "36px" }}>
            <li>{`Open the Replay browser`}</li>
            <li>{`Go to the website you want to record`}</li>
            <li>{`Press the Record button on the top right`}</li>
            <li>{`Record for a minute or less for best results`}</li>
          </ol>
          <p>Enjoy!</p>
        </>
      </FullScreenInfo>
    );
  }

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
