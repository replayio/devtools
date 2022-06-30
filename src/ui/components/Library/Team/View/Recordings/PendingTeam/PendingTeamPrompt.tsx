import React, { useState } from "react";
import hooks from "ui/hooks";
import { PendingWorkspaceInvitation } from "ui/types";

import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import * as actions from "ui/actions/app";
import { UIState } from "ui/state";
import { useConfirm } from "ui/components/shared/Confirm";
import { PrimaryButton, SecondaryButton } from "ui/components/shared/Button";
import { useRouter } from "next/router";
import { useRedirectToTeam } from "../../../utils";

type PendingTeamPromptProps = PropsFromRedux & { workspace: PendingWorkspaceInvitation };

function PendingTeamPrompt({ workspace }: PendingTeamPromptProps) {
  const redirectToTeam = useRedirectToTeam();
  const [loading, setLoading] = useState<boolean>(false);
  const { id, name, inviterEmail } = workspace;

  const acceptPendingInvitation = hooks.useAcceptPendingInvitation(onAcceptCompleted);
  const declinePendingInvitation = hooks.useRejectPendingInvitation(onDeclineCompleted);
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();

  const { confirmDestructive } = useConfirm();

  const handleAccept = () => {
    acceptPendingInvitation({ variables: { workspaceId: id } });
    setLoading(true);
  };
  const handleDecline = () => {
    confirmDestructive({
      message: "Are you sure you want to decline this invitation?",
      acceptLabel: "Decline invitation",
    }).then(confirmed => {
      if (confirmed) {
        declinePendingInvitation({ variables: { workspaceId: id } });
        setLoading(true);
      }
    });
  };
  function onDeclineCompleted() {
    redirectToTeam();
  }
  function onAcceptCompleted() {
    updateDefaultWorkspace({
      variables: { workspaceId: id },
    });
  }

  return (
    <div className="absolute top-0 left-0 grid items-center w-full h-full">
      <div className="flex flex-col max-w-lg px-12 py-8 mx-auto space-y-4 rounded-md shadow-lg bg-modalBgcolor">
        <div className="flex flex-col space-y-1">
          <div className="text-lg">
            You were invited to <strong>{name}</strong>
          </div>
          {inviterEmail ? (
            <div className="text-xs">
              Invited by <strong>{inviterEmail}</strong>
            </div>
          ) : null}
        </div>
        <div className="flex flex-row space-x-2 text-base">
          {loading ? (
            "Loading…"
          ) : (
            <>
              <PrimaryButton color="blue" onClick={handleAccept}>
                Accept
              </PrimaryButton>
              <SecondaryButton color="blue" onClick={handleDecline}>
                Decline
              </SecondaryButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  currentWorkspaceId: selectors.getWorkspaceId(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PendingTeamPrompt);
