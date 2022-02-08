import React, { useState } from "react";
import { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { PendingWorkspaceInvitation } from "ui/types";
import { OnboardingContent, OnboardingModalContainer } from "../Onboarding/index";
import Spinner from "../Spinner";
import DownloadReplayModal from "./DownloadReplayModal";

function ModalLoader() {
  return (
    <OnboardingModalContainer>
      <OnboardingContent>
        <Spinner className="h-4 w-4 animate-spin text-gray-500" />
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

type SingleInviteModalProps = PropsFromRedux & {
  workspace: PendingWorkspaceInvitation;
};

// This modal is used whenever a user is invited to Replay via a team invitation,
// and there's only one outstanding team invitation for that user. This should guide them
// through downloading the Replay browser next.
function SingleInviteModal({ workspace }: SingleInviteModalProps) {
  const { name, inviterEmail } = workspace;

  return (
    <DownloadReplayModal>
      {`You've been added to the team `}
      <strong>{name}</strong>
      {` by `}
      <strong>{inviterEmail}</strong>
      {`. Would you like to go that team, or download Replay?`}
    </DownloadReplayModal>
  );
}

const connector = connect(() => ({}), {
  hideModal: actions.hideModal,
  setWorkspaceId: actions.setWorkspaceId,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SingleInviteModalLoader);
