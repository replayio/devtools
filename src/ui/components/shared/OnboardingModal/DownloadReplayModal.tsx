import { ReactNode, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { Button } from "replay-next/components/Button";
import { removeUrlParameters } from "shared/utils/environment";
import { actions } from "ui/actions";
import { Nag, useDismissNag } from "ui/hooks/users";
import { trackEvent } from "ui/utils/telemetry";

import { DownloadingPage } from "../Onboarding/DownloadingPage";
import { DownloadPage } from "../Onboarding/DownloadPage";
import {
  OnboardingActions,
  OnboardingBody,
  OnboardingContent,
  OnboardingHeader,
  OnboardingModalContainer,
} from "../Onboarding/index";

function InitialScreen({
  onSkipToLibrary,
  onNext,
  children,
}: {
  onSkipToLibrary: () => void;
  onNext: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <OnboardingHeader>Welcome to Replay</OnboardingHeader>
      <OnboardingBody>{children}</OnboardingBody>
      <OnboardingActions>
        <Button color="primary" onClick={onSkipToLibrary} size="large">
          Go to your Library
        </Button>
        <Button color="primary" onClick={onNext} size="large">
          {`Download Replay`}
        </Button>
      </OnboardingActions>
    </>
  );
}

function DownloadReplayModal({ hideModal, children }: PropsFromRedux & { children: ReactNode }) {
  const [current, setCurrent] = useState<number>(1);
  const [randomNumber, setRandomNumber] = useState<number>(Math.random());
  const dismissNag = useDismissNag();

  const onSkipToLibrary = () => {
    removeUrlParameters();
    dismissNag(Nag.DOWNLOAD_REPLAY);
    trackEvent("onboarding.skipped_replay_download");
    hideModal();
  };
  const onNext = () => {
    setCurrent(current + 1);
    setRandomNumber(Math.random());
  };
  const onFinished = () => {
    removeUrlParameters();
    trackEvent("onboarding.finished_onboarding");
    hideModal();
  };

  let content;

  if (current === 1) {
    content = (
      <InitialScreen
        {...{
          onSkipToLibrary,
          onNext,
          hideModal,
        }}
      >
        {children}
      </InitialScreen>
    );
  } else if (current === 2) {
    content = <DownloadPage {...{ onNext, onSkipToLibrary }} />;
  } else if (current === 3) {
    content = <DownloadingPage {...{ onFinished }} />;
  } else {
    content = <div>hello</div>;
  }

  return (
    <OnboardingModalContainer {...{ randomNumber }}>
      <OnboardingContent>{content}</OnboardingContent>
    </OnboardingModalContainer>
  );
}

const connector = connect(null, {
  hideModal: actions.hideModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DownloadReplayModal);
