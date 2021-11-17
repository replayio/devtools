import React from "react";
import { PrimaryLgButton } from "ui/components/shared/Button";
import {
  OnboardingContentWrapper,
  OnboardingModalContainer,
} from "ui/components/shared/Onboarding";

function WelcomePage() {
  // const { loginWithRedirect } = useAuth0();
  // const forceOpenAuth = new URLSearchParams(window.location.search).get("signin");
  // const onLogin = () =>
  //   loginWithRedirect({
  //     appState: { returnTo: window.location.pathname + window.location.search },
  //   });

  // if (forceOpenAuth) {
  //   onLogin();
  //   return null;
  // }

  return (
    <OnboardingModalContainer theme="light">
      <OnboardingContentWrapper overlay>
        <div className="text-base space-y-4 self-start">
          <p>Optional Message of the Day</p>
        </div>
        <a href="javascript:void 0">
          <PrimaryLgButton color="blue" className="w-full justify-center">
            Login
          </PrimaryLgButton>
        </a>
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
}

export default function AccountPage() {
  return <WelcomePage />;
}
