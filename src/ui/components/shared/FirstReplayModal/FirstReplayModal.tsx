import { ConnectedProps, connect } from "react-redux";

import { Button } from "replay-next/components/Button";
import { launchAndRecordUrl } from "shared/utils/environment";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { trackEvent } from "ui/utils/telemetry";

import {
  OnboardingActions,
  OnboardingBody,
  OnboardingContent,
  OnboardingContentWrapper,
  OnboardingHeader,
  OnboardingModalContainer,
} from "../Onboarding/index";

export const REPLAY_DEMO_URL = "https://first.replay.io/";
export const REPLAY_LIBRARY_URL = "https://app.replay.io/";

function FirstReplayModal({ hideModal }: PropsFromRedux) {
  const dismissNag = hooks.useDismissNag();

  const handleOpen = () => {
    dismissNag(Nag.FIRST_REPLAY_2);
    hideModal();
    trackEvent("onboarding.demo_replay_launch");
    launchAndRecordUrl(REPLAY_DEMO_URL);
  };

  const handleSkip = () => {
    dismissNag(Nag.FIRST_REPLAY_2);
    hideModal();
    trackEvent("onboarding.demo_skip");
  };

  return (
    <OnboardingModalContainer>
      <OnboardingContentWrapper noLogo>
        <OnboardingContent>
          <OnboardingHeader>{`Let's time travel`}</OnboardingHeader>
          <OnboardingBody>
            {`We've made a Back to the Future themed demo for you to kick the tires. Ready?`}
          </OnboardingBody>
        </OnboardingContent>
        <OnboardingActions>
          <Button onClick={handleOpen}>{`Ready as I'll ever be, Doc`}</Button>
          <Button onClick={handleSkip} size="large" variant="outline">
            {`Skip`}
          </Button>
        </OnboardingActions>
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
}

const connector = connect(null, { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(FirstReplayModal);
