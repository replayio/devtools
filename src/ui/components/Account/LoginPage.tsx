import React, { useEffect } from "react";
import { setUserInBrowserPrefs } from "../../utils/browser";
import FullScreenInfo from "./FullScreenInfo";
import useAuth0 from "ui/utils/useAuth0";
import "./LoginPage.css";

export default function LoginPage() {
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
    <div className="login-page">
      <FullScreenInfo header="Welcome to Replay">
        <>
          <button onClick={() => loginWithRedirect()}>Sign In</button>
        </>
      </FullScreenInfo>
    </div>
  );
}
