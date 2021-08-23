import React, { useState } from "react";
import { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { PendingWorkspaceInvitation } from "ui/types";
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
import Spinner from "../Spinner";

function ModalLoader() {
  return (
    <OnboardingModalContainer>
      <OnboardingContent>
        <Spinner className="animate-spin h-6 w-6 text-gray-500" />
      </OnboardingContent>
    </OnboardingModalContainer>
  );
}

// This is the main component that we export. This kicks off the process of auto-accepting
// the invitation to the workspace that the user was invited to. First, this separately queries
// the workspace so we have it ready.
function SingleInviteModalLoader(props: PropsFromRedux) {
  const [workspace, setWorkspace] = useState<null | PendingWorkspaceInvitation>(null);
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  useEffect(() => {
    if (!loading && pendingWorkspaces && !workspace) {
      setWorkspace(pendingWorkspaces[0]);
    }
  }, [pendingWorkspaces]);

  if (!workspace) {
    return <ModalLoader />;
  }

  return <AutoAccept {...{ ...props, workspace }} />;
}

// Once we have the workspace, this component should handle auto-accepting that invitation.
function AutoAccept(props: SingleInviteModalProps) {
  const { setWorkspaceId, workspace } = props;
  const [accepted, setAccepted] = useState(false);

  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const acceptPendingInvitation = hooks.useAcceptPendingInvitation(() => {
    updateDefaultWorkspace({ variables: { workspaceId: workspace.id } });
    setWorkspaceId(workspace.id);
    setAccepted(true);
  });

  useEffect(() => {
    acceptPendingInvitation({ variables: { workspaceId: workspace.id } });
  }, []);

  if (!accepted) {
    return <ModalLoader />;
  }

  return <SingleInviteModal {...props} />;
}

function InitialScreen({
  onSkipToLibrary,
  onNext,
  name,
  inviterEmail,
}: {
  onSkipToLibrary: () => void;
  onNext: () => void;
  name: string | null;
  inviterEmail: string | null;
}) {
  return (
    <>
      <OnboardingHeader>Welcome to Replay</OnboardingHeader>
      <OnboardingBody>
        {`You've been added to the team `}
        <strong>{name}</strong>
        {` by `}
        <strong>{inviterEmail}</strong>
        {`. Would you like to go that team, or download Replay?`}
      </OnboardingBody>
      <OnboardingActions>
        <SecondaryLgButton color="blue" onClick={onSkipToLibrary}>
          {`Go to ${name}`}
        </SecondaryLgButton>
        <PrimaryLgButton color="blue" onClick={onNext}>
          {`Download Replay`}
        </PrimaryLgButton>
      </OnboardingActions>
    </>
  );
}

type SingleInviteModalProps = PropsFromRedux & {
  workspace: PendingWorkspaceInvitation;
};

// This modal is used whenever a user is invited to Replay via a team invitation,
// and there's only one outstanding team invitation for that user. This should guide them
// through 1) creating a team, and/or 2) downloading the Replay browser.
function SingleInviteModal({ hideModal, workspace }: SingleInviteModalProps) {
  const [current, setCurrent] = useState<number>(1);
  const [randomNumber, setRandomNumber] = useState<number>(Math.random());
  const { name, inviterEmail } = workspace;

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

  const props = {
    onSkipToLibrary,
    onNext,
    name,
    inviterEmail,
    hideModal,
  };

  let content;

  if (current === 1) {
    content = <InitialScreen {...props} />;
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
export default connector(SingleInviteModalLoader);
