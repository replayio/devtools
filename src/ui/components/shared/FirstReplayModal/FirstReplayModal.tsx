import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { PrimaryLgButton } from "../Button";
import { TextInputCopy } from "../NewWorkspaceModal/InvitationLink";
import {
  OnboardingBody,
  OnboardingActions,
  OnboardingHeader,
  OnboardingModalContainer,
  OnboardingContent,
} from "../Onboarding/index";
import { UrlCopy } from "../SharingModal/ReplayLink";

const FIRST_REPLAY_TARGET = "https://replay.io/demo";

const RecordIcon = () => (
  <span className="bg-primaryAccent text-white rounded-lg px-2 py-1 uppercase text-lg">⦿ REC</span>
);

function FirstReplayModal({ hideModal }: PropsFromRedux) {
  const userInfo = hooks.useGetUserInfo();
  const updateUserNags = hooks.useUpdateUserNags();

  const handleOpen = () => {
    const newNags = [...userInfo.nags, Nag.FIRST_REPLAY_2];
    updateUserNags({
      variables: { newNags },
    });
    hideModal();
    window.open(FIRST_REPLAY_TARGET);
  };

  return (
    <OnboardingModalContainer>
      <OnboardingContent>
        <OnboardingHeader>Create your first Replay</OnboardingHeader>
        <OnboardingBody>
          {`We've put together a demo to show you how Replay works. Once it's opened in a new tab, press the record `}
          <RecordIcon />
          {` button to start recording.`}
        </OnboardingBody>
        <TextInputCopy text={FIRST_REPLAY_TARGET} isLarge={true} isCenter={true} />
        <OnboardingActions>
          <PrimaryLgButton color="blue" onClick={handleOpen}>
            {`Open this website in a new tab`}
          </PrimaryLgButton>
        </OnboardingActions>
      </OnboardingContent>
    </OnboardingModalContainer>
  );
}

const connector = connect(() => ({}), { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(FirstReplayModal);
