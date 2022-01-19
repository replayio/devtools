import React, { useEffect } from "react";

import { setUserInBrowserPrefs } from "ui/utils/browser";
import { isTeamMemberInvite } from "ui/utils/onboarding";
import useAuth0 from "ui/utils/useAuth0";

import { PrimaryLgButton } from "../Button";
import { OnboardingContentWrapper, OnboardingModalContainer } from "../Onboarding";

export default function Login() {
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
          {isTeamMemberInvite() ? "Sign in with Google" : "Log in"}
        </PrimaryLgButton>
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
}
