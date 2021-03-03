import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";

import LoginButton from "ui/components/LoginButton";
import Dropdown from "ui/components/shared/Dropdown";
import Avatar from "ui/components/Avatar";
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

  const buttonContent = <Avatar player={user} isFirstPlayer={true} />;

  return (
    <div className="user-options">
      <Dropdown
        buttonContent={buttonContent}
        setExpanded={setExpanded}
        expanded={expanded}
        orientation="bottom"
      >
        <div className="user row">
          <div className="user-avatar">
            <Avatar player={user} isFirstPlayer={true} />
          </div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>

        <div className="row clickable logout">
          <LoginButton />
        </div>
        <button onClick={() => setModal("settings")}>Click</button>
      </Dropdown>
    </div>
  );
}

export default connect(null, {
  setModal: actions.setModal,
})(UserOptions);
