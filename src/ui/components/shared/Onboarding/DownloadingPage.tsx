import { useEffect, useRef } from "react";

import { Button } from "replay-next/components/Button";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";

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
        <Button onClick={onFinished} size="large">
          Take me to my library
        </Button>
      </OnboardingActions>
    </>
  );
}
