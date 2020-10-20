import React, { useEffect, useState } from "react";
import LoginButton from "ui/components/LoginButton";
import Dropdown from "ui/components/shared/Dropdown";
import Avatar from "ui/components/Avatar";
import { useAuth0 } from "@auth0/auth0-react";
import "./UserOptions.css";

export default function UserOptions() {
  const [expanded, setExpanded] = useState(false);
  const { isAuthenticated, user } = useAuth0();

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  const buttonContent = (
    <>
      <Avatar player={user} isFirstPlayer={true} />
      <div className="img expand" />
    </>
  );

  return (
    <div className="user-options">
      <Dropdown buttonContent={buttonContent} setExpanded={setExpanded} expanded={expanded}>
        <div className="user row">
          <div className="user-avatar">
            <Avatar player={user} isFirstPlayer={true} />
          </div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
        <div className="row clickable">
          <a
            className="changelog"
            href="https://headwayapp.co/replay-changelog"
            target="_blank"
            rel="noreferrer"
          >
            <button>Changelog</button>
          </a>
        </div>
        <div className="row clickable">
          <LoginButton />
        </div>
      </Dropdown>
    </div>
  );
}
