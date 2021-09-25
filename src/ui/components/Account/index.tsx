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
  OnboardingContentWrapper,
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
        <OnboardingContentWrapper>
          <OnboardingContent>
            <OnboardingHeader>👋 Welcome</OnboardingHeader>
            <OnboardingBody>
              {"Welcome to Replay - the new way to record, replay, and debug web applications!"}
            </OnboardingBody>
          </OnboardingContent>
          <OnboardingActions>
            <PrimaryLgButton color="blue" onClick={onLogin}>
              Sign in with Google
            </PrimaryLgButton>
          </OnboardingActions>
        </OnboardingContentWrapper>
      </OnboardingModalContainer>
    );
  }

  return (
    <OnboardingModalContainer theme="light">
      <OnboardingContentWrapper overlay>
        {isTeamMemberInvite() ? <h1 className="text-2xl font-extrabold">Almost there!</h1> : null}
        <div className="text-base space-y-4 self-start">
          {isTeamMemberInvite() ? (
            <p>In order to join your team, we first need you to sign in.</p>
          ) : (
            <>
              <p className="text-center">
                Replay captures everything you need for the perfect bug report, all in one link.{" "}
                <a href="https://replay.io" className="underline pointer-hand">
                  Learn more
                </a>
              </p>
              <p></p>
            </>
          )}
        </div>
        <PrimaryLgButton color="blue" onClick={onLogin} className="w-full justify-center">
          {isTeamMemberInvite() ? "Sign in with Google" : "Login"}
        </PrimaryLgButton>
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
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
