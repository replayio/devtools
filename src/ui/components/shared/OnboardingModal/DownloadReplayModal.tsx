import React, { ReactNode, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { removeUrlParameters } from "ui/utils/environment";
import { trackEvent } from "ui/utils/telemetry";
import { PrimaryLgButton, SecondaryLgButton } from "../Button";
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
        <SecondaryLgButton color="blue" onClick={onSkipToLibrary}>
          Skip
        </SecondaryLgButton>
        <PrimaryLgButton color="blue" onClick={onNext}>
          {`Download Replay`}
        </PrimaryLgButton>
      </OnboardingActions>
    </>
  );
}

function DownloadReplayModal({ hideModal, children }: PropsFromRedux & { children: ReactNode }) {
  const [current, setCurrent] = useState<number>(1);
  const [randomNumber, setRandomNumber] = useState<number>(Math.random());

  const onSkipToLibrary = () => {
    removeUrlParameters();
    trackEvent("skipped-replay-download");
    hideModal();
  };
  const onNext = () => {
    setCurrent(current + 1);
    setRandomNumber(Math.random());
  };
  const onFinished = () => {
    removeUrlParameters();
    trackEvent("finished-onboarding");
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

const connector = connect(() => ({}), {
  hideModal: actions.hideModal,
  setWorkspaceId: actions.setWorkspaceId,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DownloadReplayModal);
