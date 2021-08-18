import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import useAuth0 from "ui/utils/useAuth0";
import { setUserInBrowserPrefs } from "../../utils/browser";
import { isTeamMemberInvite } from "ui/utils/environment";
import { createReplayURL } from "views/app";
import Library from "./Library";

import "./Account.css";
import "../Header/Header.css";
import "devtools/client/debugger/src/components/shared/AccessibleImage.css";
import BlankScreen from "../shared/BlankScreen";
import Modal from "../shared/NewModal";
import { Button } from "../shared/Button";

function WelcomePage() {
  const { loginWithRedirect } = useAuth0();
  const forceOpenAuth = new URLSearchParams(window.location.search).get("signin");
  const onLogin = () =>
    loginWithRedirect({
      redirectUri: window.location.origin,
      appState: { returnTo: window.location.href },
    });

  if (forceOpenAuth) {
    onLogin();
    return null;
  }

  useEffect(() => {
    setUserInBrowserPrefs(null);
  }, []);

  const text = isTeamMemberInvite()
    ? "In order to join your team, we first need you to sign in."
    : "Welcome to Replay - the new way to record, replay, and debug web applications!";

  return (
    <>
      <BlankScreen className="fixed" background="white" />
      <Modal options={{ maskTransparency: "transparent" }}>
        <div
          className="p-12 bg-white text-xl space-y-8 relative flex flex-col items-center"
          style={{ width: "520px" }}
        >
          <div className="space-y-4 place-content-center">
            <img className="w-16 h-16 mx-auto" src="/images/logo.svg" />
          </div>
          <div className="text-3xl font-semibold">👋 Welcome</div>
          <div className="text-center">{text}</div>
          <Button size="2xl" style="primary" color="blue">
            Sign in
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function Account() {
  const { isAuthenticated } = useAuth0();
  const history = useHistory();
  const searchParams = new URLSearchParams(window.location.search);

  useEffect(() => {
    if (searchParams.get("id")) {
      history.replace(createReplayURL(searchParams));
    }
  }, []);

  if (searchParams.get("id")) {
    return null;
  }

  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  return <Library />;
}
