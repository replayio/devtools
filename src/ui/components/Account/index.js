import React, { useEffect } from "react";
import Dashboard from "../Dashboard/index";
import { useAuth0 } from "@auth0/auth0-react";
import { setUserInBrowserPrefs } from "../../utils/browser";
import UserOptions from "ui/components/Header/UserOptions";

import "./Account.css";

function WelcomePage() {
  const { loginWithRedirect } = useAuth0();
  const forceOpenAuth = new URLSearchParams(window.location.search).get("signin");

  if (forceOpenAuth) {
    loginWithRedirect();
    return null;
  }

  useEffect(() => {
    setUserInBrowserPrefs(null);
  }, []);

  return (
    <div className="welcome-screen">
      <div className="welcome-panel">
        <img className="logo" src="images/logo.svg" />
        <img className="atwork" src="images/computer-work.svg" />
        <button onClick={() => loginWithRedirect()}>Sign In</button>
      </div>
    </div>
  );
}

function AccountHeader() {
  return (
    <div id="header">
      <div className="header-left">
        <div className="logo" />
        <div className="title-label">Replay</div>
      </div>
      <UserOptions mode="account" />
    </div>
  );
}

export default function Account() {
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  return (
    <>
      <AccountHeader />
      <Dashboard />
    </>
  );
}
