import React from "react";
import { PrimaryLgButton } from "../Button";
import { OnboardingActions, OnboardingBody, OnboardingHeader } from "../Onboarding/index";

export function DownloadingPage({ onFinished }: { onFinished: () => void }) {
  return (
    <>
      <OnboardingHeader>Downloading Replay ...</OnboardingHeader>
      <OnboardingBody>
        {`Once the download is finished, install and open the Replay browser. We'll see you there!`}
      </OnboardingBody>
      <OnboardingActions>
        <PrimaryLgButton color="blue" onClick={onFinished}>
          Take me to my library
        </PrimaryLgButton>
      </OnboardingActions>
    </>
  );
}
