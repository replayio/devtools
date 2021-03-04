import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";

import LoginButton from "ui/components/LoginButton";
import Dropdown from "ui/components/shared/Dropdown";
import { isDeployPreview } from "ui/utils/environment";
import { useAuth0 } from "@auth0/auth0-react";
import "./UserOptions.css";

function UserOptions({ setModal }) {
  const [expanded, setExpanded] = useState(false);
  const { isAuthenticated, user } = useAuth0();

  if (isDeployPreview()) {
    return null;
  }

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  // const buttonContent = <Avatar player={user} isFirstPlayer={true} />;
  const buttonContent = (
    <button>
      <span className="material-icons">more_horiz</span>
    </button>
  );

  const dashboardUrl = `${window.location.origin}/view`;

  const onLibraryClick = () => {
    if (event.metaKey) {
      return window.open(dashboardUrl);
    }
    window.location = dashboardUrl;
  };
  const onSettingsClick = () => {
    setExpanded(false);
    setModal("settings");
  };

  return (
    <div className="user-options">
      <Dropdown
        buttonContent={buttonContent}
        setExpanded={setExpanded}
        expanded={expanded}
        orientation="bottom"
      >
        {/* <div className="user row">
          <div className="user-avatar">
            <Avatar player={user} isFirstPlayer={true} />
          </div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div> */}
        <button className="row" onClick={onLibraryClick}>
          <span className="material-icons">home</span>
          <span>Library</span>
        </button>
        <button className="row" onClick={onSettingsClick}>
          <span className="material-icons">settings</span>
          <span>Settings</span>
        </button>
        <LoginButton />
      </Dropdown>
    </div>
  );
}

export default connect(null, {
  setModal: actions.setModal,
})(UserOptions);
