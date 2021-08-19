import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import useAuth0 from "ui/utils/useAuth0";
import { setUserInBrowserPrefs } from "../../utils/browser";
import { isTeamLeaderInvite, isTeamMemberInvite } from "ui/utils/environment";
import { createReplayURL } from "views/app";
import Library from "./Library";

import "./Account.css";
import "../Header/Header.css";
import "devtools/client/debugger/src/components/shared/AccessibleImage.css";
import BlankScreen from "../shared/BlankScreen";
import Modal from "../shared/NewModal";
import { PrimaryLgButton } from "../shared/Button";
import {
  ModalHeader,
  ReplayLogo,
} from "../shared/TeamLeaderOnboardingModal/TeamLeaderOnboardingModal";
const Circles = require("ui/components/shared/Circles").default;

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

  if (isTeamLeaderInvite()) {
    return (
      <>
        <BlankScreen className="fixed" background="white" />
        <Circles randomNumber={Math.random()} />
        <Modal options={{ maskTransparency: "transparent" }} blurMask={false}>
          <div
            className="p-12 text-4xl space-y-16 relative flex flex-col items-center"
            style={{ width: "800px" }}
          >
            <ReplayLogo />
            <ModalHeader>👋 Welcome</ModalHeader>
            <div className="text-center">
              {"Welcome to Replay - the new way to record, replay, and debug web applications!"}
            </div>
            <div className="space-x-4 pt-16">
              <PrimaryLgButton color="blue" onClick={onLogin}>
                Sign in
              </PrimaryLgButton>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <main
      className="w-full h-full grid"
      style={{ background: "linear-gradient(to bottom right, #68DCFC, #4689F8)" }}
    >
      <section className="max-w-lg w-full m-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-16 h-84 space-y-12">
          <div className="space-y-4 place-content-center">
            <img className="w-16 h-16 mx-auto" src="/images/logo.svg" />
          </div>
          {isTeamMemberInvite() ? (
            <div className="text-center space-y-2">
              <div className="font-bold text-2xl">Almost there!</div>
              <div className="font-medium text-xl">
                In order to join your team, we first need you to sign in.
              </div>
            </div>
          ) : null}
          <a
            href="#"
            onClick={onLogin}
            className="w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-2xl font-medium rounded-md text-white bg-primaryAccent hover:bg-primaryAccentHover"
          >
            Sign in to Replay
          </a>
        </div>
      </section>
    </main>
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
