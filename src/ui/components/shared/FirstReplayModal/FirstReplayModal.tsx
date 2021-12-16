import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { launchAndRecordUrl } from "ui/utils/environment";
import { trackEvent } from "ui/utils/telemetry";
import { PrimaryLgButton } from "../Button";
import { TextInputCopy } from "../NewWorkspaceModal/InvitationLink";
import {
  OnboardingBody,
  OnboardingActions,
  OnboardingHeader,
  OnboardingModalContainer,
  OnboardingContent,
  OnboardingContentWrapper,
} from "../Onboarding/index";

export const REPLAY_DEMO_URL = "https://static.replay.io/demo/";

function FirstReplayModal({ hideModal }: PropsFromRedux) {
  const dismissNag = hooks.useDismissNag();

  const handleOpen = () => {
    dismissNag(Nag.FIRST_REPLAY_2);
    hideModal();
    trackEvent("onboarding.demo_replay_launch");
    launchAndRecordUrl(REPLAY_DEMO_URL);
  };

  return (
    <OnboardingModalContainer>
      <OnboardingContentWrapper>
        <OnboardingContent>
          <OnboardingHeader>{`Let's time travel`}</OnboardingHeader>
          <OnboardingBody>
            {`We've made a Back to the Future themed demo for you to kick the tires. Ready?`}
          </OnboardingBody>
        </OnboardingContent>
        <OnboardingActions>
          <PrimaryLgButton color="blue" onClick={handleOpen}>
            {`Ready as I'll ever be, Doc`}
          </PrimaryLgButton>
        </OnboardingActions>
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
}

const connector = connect(() => ({}), { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(FirstReplayModal);
