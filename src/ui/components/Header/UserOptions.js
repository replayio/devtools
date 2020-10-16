import React, { useEffect, useState } from "react";
import LoginButton from "ui/components/LoginButton";
import Dropdown from "ui/components/shared/Dropdown";
import Avatar from "ui/components/Avatar";
import { useAuth0 } from "@auth0/auth0-react";
import "./UserOptions.css";

function Changelog() {
  useEffect(() => {
    if (typeof Headway === "object") {
      Headway.init(HW_config);
    }
  }, []);

  return (
    <div className="row clickable">
      <button className="changelog">
        <a id="headway" onClick={Headway.toggle}>
          What&apos;s new
        </a>
      </button>
    </div>
  );
}

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
        <Changelog />
        <div className="row clickable">
          <LoginButton />
        </div>
      </Dropdown>
    </div>
  );
}
