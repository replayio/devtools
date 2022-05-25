import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import Avatar from "ui/components/Avatar";
import {
  Dropdown,
  DropdownItem,
  DropdownItemContent,
  DropdownLinkItem,
} from "ui/components/Library/LibraryDropdown";
import LoginButton from "ui/components/LoginButton";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

interface UserOptionsProps extends PropsFromRedux {
  noBrowserItem?: boolean;
}

function UserOptions({ setModal, noBrowserItem }: UserOptionsProps) {
  const { isAuthenticated, user, logout } = useAuth0();

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

  return (
    <div className="user-options">
      <Dropdown trigger={<MaterialIcon iconSize="xl">more_horiz</MaterialIcon>}>
        <DropdownItem onClick={onDocsClick}>
          <DropdownItemContent icon="docs">Docs</DropdownItemContent>
        </DropdownItem>
        <DropdownLinkItem href="https://discord.gg/n2dTK6kcRX">
          <DropdownItemContent icon="help">Chat with us</DropdownItemContent>
        </DropdownLinkItem>
        <DropdownItem onClick={onSettingsClick}>
          <DropdownItemContent icon="settings">Settings</DropdownItemContent>
        </DropdownItem>
        {window.__IS_RECORD_REPLAY_RUNTIME__ || noBrowserItem ? null : (
          <DropdownItem onClick={onLaunchClick}>
            <DropdownItemContent icon="replay-logo">Launch Replay</DropdownItemContent>
          </DropdownItem>
        )}
        <DropdownItem onClick={() => logout()}>
          <div className="flex flex-row space-x-4">
            <div className={"flex w-4 flex-row items-center"}>
              <Avatar player={user} isFirstPlayer={true} />
            </div>
            <span className="overflow-hidden overflow-ellipsis whitespace-pre">Sign Out</span>
          </div>
        </DropdownItem>
      </Dropdown>
    </div>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(UserOptions);
