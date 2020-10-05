import React, { useState } from "react";
import UserPrompt from "./UserPrompt";
import classnames from "classnames";
import { useAuth0 } from "@auth0/auth0-react";

function RefreshButton() {
  const [clicked, setClicked] = useState(false);
  const handleClick = () => {
    setClicked(true);
    window.location = window.location.href;
  };

  return (
    <button className={classnames({ clicked })} onClick={handleClick}>
      <div className="img refresh" />
      <span className="content">Refresh</span>
    </button>
  );
}

export function PopupBlockedError() {
  return (
    <UserPrompt classnames={["error", "overlay"]}>
      <h1>Uh-oh</h1>
      <p>Please turn off your pop-up blocker and refresh this page.</p>
      <RefreshButton />
    </UserPrompt>
  );
}

export function SessionError({ error }) {
  return (
    <UserPrompt classnames={["error", "overlay"]}>
      <h1>Whoops!</h1>
      <p>Looks like something went wrong with this page.</p>
      <RefreshButton />
      <p className="tip">Error: {error}</p>
    </UserPrompt>
  );
}

export function UnauthorizedAccessError() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  return (
    <UserPrompt classnames={["error"]}>
      <h1>This is a private recording</h1>
      {!isAuthenticated ? (
        <>
          <p>You need to sign in to view this recording.</p>
          <button onClick={loginWithRedirect}>Sign in</button>
        </>
      ) : (
        <p>You don&apos;t have permission to view this recording.</p>
      )}
    </UserPrompt>
  );
}