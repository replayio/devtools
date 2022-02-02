import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import LoginButton from "ui/components/LoginButton";
import Dropdown from "ui/components/shared/Dropdown";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import useAuth0 from "ui/utils/useAuth0";
import { features } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import { useIntercom } from "react-use-intercom";
import IconDocs from "./docs.svg";
import IconHelp from "./help.svg";
import IconSettings from "./settings.svg";
import IconReplayLogo from "./replay-logo.svg";

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

    if (features.launchBrowser) {
      setModal("browser-launch");
    } else {
      const launchUrl = `${window.location.origin}/welcome`;
      if (event.metaKey) {
        return window.open(launchUrl);
      }
      // right now we just send you to the download screen, but eventually this will launch Replay
      window.location.href = launchUrl;
    }
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
        <button className="row" onClick={onDocsClick}>
          <IconDocs />
          <span>Docs</span>
        </button>
        <button className="row" onClick={onChatClick}>
          <IconHelp />
          <span>Chat with us</span>
        </button>
        <button className="row" onClick={onSettingsClick}>
          <IconSettings />
          <span>Settings</span>
        </button>
        {features.launchBrowser ? (
          window.__IS_RECORD_REPLAY_RUNTIME__ || noBrowserItem ? null : (
            <button className="row" onClick={onLaunchClick}>
              <IconReplayLogo />
              <span>Launch Replay</span>
            </button>
          )
        ) : (
          <button className="row" onClick={onLaunchClick}>
            <MaterialIcon iconSize="xl">download</MaterialIcon>
            <span>Download Replay</span>
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
