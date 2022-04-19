import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { useIntercom } from "react-use-intercom";
import * as actions from "ui/actions/app";
import LoginButton from "ui/components/LoginButton";
import Dropdown from "ui/components/shared/Dropdown";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { features } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

interface UserOptionsProps extends PropsFromRedux {
  noBrowserItem?: boolean;
}

function UserOptions({ setModal, noBrowserItem }: UserOptionsProps) {
  const recordingId = hooks.useGetRecordingId();
  const [expanded, setExpanded] = useState(false);
  const { show } = useIntercom();
  const { isAuthenticated } = useAuth0();

  const isOwner = hooks.useIsOwner();
  const isCollaborator =
    hooks.useIsCollaborator(recordingId || "00000000-0000-0000-0000-000000000000") &&
    isAuthenticated;

  if (!isAuthenticated) {
    return <LoginButton />;
  }

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
  const onChatClick = () => {
    setExpanded(false);
    show();
  };

  return (
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
        <button className="row group" onClick={onChatClick}>
          <Icon filename="help" className="bg-iconColor" />
          <span>Chat with us</span>
        </button>
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
        <LoginButton />
      </Dropdown>
    </div>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(UserOptions);
