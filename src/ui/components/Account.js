import React, { useEffect } from "react";
import Recordings from "./Recordings/index";
import { useAuth0 } from "@auth0/auth0-react";
import Header from "./Header";

function WelcomePage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="welcome-screen">
      <div className="welcome-panel">
        <img className="logo" src="images/logo.svg" />
        <img className="atwork" src="images/computer-work.svg" />
        <button onClick={() => loginWithRedirect()}>Log In</button>
      </div>
    </div>
  );
}

function AccountPage() {
  return <Recordings />;
}

export default function Account() {
  const { isAuthenticated } = useAuth0();
  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  return (
    <>
      <Header />
      <AccountPage />
    </>
  );
}
