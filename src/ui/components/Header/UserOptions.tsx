import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { useIntercom } from "react-use-intercom";
import * as actions from "ui/actions/app";
import { Dropdown, DropdownItem, DropdownItemContent } from "ui/components/Library/LibraryDropdown";
import LoginButton from "ui/components/LoginButton";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

interface UserOptionsProps extends PropsFromRedux {
  noBrowserItem?: boolean;
}

function UserOptions({ setModal, noBrowserItem }: UserOptionsProps) {
  const { show } = useIntercom();
  const { isAuthenticated } = useAuth0();

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
    trackEvent("user_options.launch_replay");

    setModal("browser-launch");
  };
  const onSettingsClick = () => {
    trackEvent("user_options.select_settings");

    setModal("settings");
  };
  const onChatClick = () => {
    show();
  };

  return (
    <div className="user-options">
      <Dropdown trigger={<MaterialIcon iconSize="xl">more_horiz</MaterialIcon>}>
        <DropdownItem onClick={onDocsClick}>
          <DropdownItemContent icon="docs">Docs</DropdownItemContent>
        </DropdownItem>
        <DropdownItem onClick={onChatClick}>
          <DropdownItemContent icon="help">Chat with us</DropdownItemContent>
        </DropdownItem>
        <DropdownItem onClick={onSettingsClick}>
          <DropdownItemContent icon="settings">Settings</DropdownItemContent>
        </DropdownItem>
        {window.__IS_RECORD_REPLAY_RUNTIME__ || noBrowserItem ? null : (
          <DropdownItem onClick={onLaunchClick}>
            <DropdownItemContent icon="replay-logo">Launch Replay</DropdownItemContent>
          </DropdownItem>
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
