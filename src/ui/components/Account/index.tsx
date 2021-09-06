import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import useAuth0 from "ui/utils/useAuth0";
import { setUserInBrowserPrefs } from "../../utils/browser";
import { isTeamLeaderInvite, isTeamMemberInvite } from "ui/utils/environment";
import { createReplayURL } from "views/app";
import Library from "../Library/index";

import "./Account.css";
import "../Header/Header.css";
import "devtools/client/debugger/src/components/shared/AccessibleImage.css";
import { PrimaryLgButton } from "../shared/Button";
import {
  OnboardingActions,
  OnboardingBody,
  OnboardingContent,
  OnboardingHeader,
  OnboardingModalContainer,
} from "../shared/Onboarding/index";

function WelcomePage() {
  const { loginWithRedirect } = useAuth0();
  const forceOpenAuth = new URLSearchParams(window.location.search).get("signin");
  const onLogin = () =>
    loginWithRedirect({
      appState: { returnTo: window.location.pathname + window.location.search },
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
      <OnboardingModalContainer>
        <OnboardingContent>
          <OnboardingHeader>👋 Welcome</OnboardingHeader>
          <OnboardingBody>
            {"Welcome to Replay - the new way to record, replay, and debug web applications!"}
          </OnboardingBody>
          <OnboardingActions>
            <PrimaryLgButton color="blue" onClick={onLogin}>
              Sign in
            </PrimaryLgButton>
          </OnboardingActions>
        </OnboardingContent>
      </OnboardingModalContainer>
    );
  }

  return (
    <main
      className="w-full h-full grid"
      style={{ background: "linear-gradient(to bottom right, #68DCFC, #4689F8)" }}
    >
      <section className="max-w-sm w-full m-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-12 space-y-9">
          <div className="space-y-3 place-content-center">
            <img className="w-12 h-12 mx-auto" src="/images/logo.svg" />
          </div>
          {isTeamMemberInvite() ? (
            <div className="text-center space-y-1.5">
              <div className="font-bold text-xl">Almost there!</div>
              <div className="font-medium text-lg">
                In order to join your team, we first need you to sign in.
              </div>
            </div>
          ) : null}
          <a
            href="#"
            onClick={onLogin}
            className="w-full inline-flex items-center justify-center px-3.5 py-2 border border-transparent text-lg font-medium rounded-md text-white bg-primaryAccent hover:bg-primaryAccentHover"
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
