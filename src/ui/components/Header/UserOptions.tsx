import React, { useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import * as actions from "ui/actions/app";
import LoginButton from "ui/components/LoginButton";
import ReplayAssistButton from "ui/components/ReplayAssistButton";
import Dropdown from "ui/components/shared/Dropdown";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

import ExternalLink from "../shared/ExternalLink";

interface UserOptionsProps extends PropsFromRedux {
  noBrowserItem?: boolean;
}

function UserOptions({ setModal, noBrowserItem }: UserOptionsProps) {
  const [expanded, setExpanded] = useState(false);
  const { isAuthenticated } = useAuth0();

  const onDocsClick: React.MouseEventHandler = event => {
    trackEvent("user_options.select_docs");
    const docsUrl = `https://docs.replay.io`;

    if (event.metaKey) {
      return window.open(docsUrl, "replaydocs");
    }
    window.open(docsUrl, "replaydocs");
  };
  const onLaunchClick: React.MouseEventHandler = event => {
    setExpanded(false);
    trackEvent("user_options.launch_replay");

    setModal("browser-launch");
  };
  const onSettingsClick = () => {
    setExpanded(false);
    trackEvent("user_options.select_settings");

    setModal("settings");
  };

  return (
    <>
      <div style={{ display: "none" }}>
        <Icon filename="docs" className="bg-iconColor" />
        <Icon filename="help" className="bg-iconColor" />
        <Icon filename="settings" className="bg-iconColor" />
        <Icon filename="replay-logo" className="bg-iconColor" />
      </div>
      <div className="user-options text-blue-400">
        <Dropdown
          buttonContent={<MaterialIcon iconSize="xl">more_horiz</MaterialIcon>}
          setExpanded={setExpanded}
          expanded={expanded}
          orientation="bottom"
        >
          <button className="row group" onClick={onDocsClick}>
            <Icon filename="docs" className="bg-iconColor" />
            <span>Docs</span>
          </button>
          <ExternalLink className="row group" href="https://discord.gg/n2dTK6kcRX">
            <Icon filename="help" className="bg-iconColor" />
            <span>Chat with us</span>
          </ExternalLink>
          <button className="row group" onClick={onSettingsClick}>
            <Icon filename="settings" className="bg-iconColor" />
            <span>Settings</span>
          </button>
          {window.__IS_RECORD_REPLAY_RUNTIME__ || noBrowserItem ? null : (
            <button className="row group" onClick={onLaunchClick}>
              <Icon filename="replay-logo" className="bg-iconColor" />
              <span>Launch Replay</span>
            </button>
          )}
          <ReplayAssistButton />
          <LoginButton />
        </Dropdown>
      </div>
    </>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(UserOptions);
