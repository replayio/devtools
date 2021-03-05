import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";

import LoginButton from "ui/components/LoginButton";
import Dropdown from "ui/components/shared/Dropdown";
import { isDeployPreview } from "ui/utils/environment";
import { useAuth0 } from "@auth0/auth0-react";
import "./UserOptions.css";
import { features } from "ui/utils/prefs";

function UserOptions({ setModal }) {
  const [expanded, setExpanded] = useState(false);
  const { isAuthenticated } = useAuth0();

  if (isDeployPreview()) {
    return null;
  }

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  const onLibraryClick = () => {
    const dashboardUrl = `${window.location.origin}/view`;

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
        buttonContent={<span className="material-icons">more_horiz</span>}
        setExpanded={setExpanded}
        expanded={expanded}
        orientation="bottom"
      >
        <button className="row" onClick={onLibraryClick}>
          <span className="material-icons">home</span>
          <span>Library</span>
        </button>
        {features.settings && (
          <button className="row" onClick={onSettingsClick}>
            <span className="material-icons">settings</span>
            <span>Settings</span>
          </button>
        )}
        <LoginButton />
      </Dropdown>
    </div>
  );
}

export default connect(null, {
  setModal: actions.setModal,
})(UserOptions);
