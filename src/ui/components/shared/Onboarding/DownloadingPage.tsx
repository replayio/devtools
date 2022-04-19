import React, { useEffect, useRef } from "react";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { PrimaryLgButton } from "../Button";
import { OnboardingActions, OnboardingBody, OnboardingHeader } from "../Onboarding/index";

export function DownloadingPage({ onFinished }: { onFinished: () => void }) {
  const dismissNag = hooks.useDismissNag();
  const didMountRef = useRef(false);

  useEffect(() => {
    if (didMountRef.current) {
      return;
    }

    didMountRef.current = true;

    dismissNag(Nag.DOWNLOAD_REPLAY);
  });

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
