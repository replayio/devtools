import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import hooks from "ui/hooks";
import { PendingWorkspaceInvitation } from "ui/types";
import { getWorkspaceRoute } from "ui/utils/routes";
import { PrimaryButton, SecondaryButton } from "../shared/Button";

interface PendingTeamPromptProps {
  workspace: PendingWorkspaceInvitation;
}

export default function PendingTeamPrompt({ workspace }: PendingTeamPromptProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const { id, name, inviterEmail } = workspace;
  const history = useHistory();

  const acceptPendingInvitation = hooks.useAcceptPendingInvitation(onAcceptCompleted);
  const declinePendingInvitation = hooks.useRejectPendingInvitation(onDeclineCompleted);
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();

  const handleAccept = () => {
    acceptPendingInvitation({ variables: { workspaceId: id } });
    setLoading(true);
  };
  const handleDecline = () => {
    const message = "Are you sure you want to decline this invitation?";
    if (window.confirm(message)) {
      declinePendingInvitation({ variables: { workspaceId: id } });
      setLoading(true);
    }
  };
  function onDeclineCompleted() {
    history.push(getWorkspaceRoute(null));
  }
  function onAcceptCompleted() {
    updateDefaultWorkspace({
      variables: { workspaceId: id },
    });
  }

  return (
    <div className="absolute w-full h-full top-0 left-0 grid items-center">
      <div className="flex flex-col max-w-lg mx-auto bg-white shadow-lg rounded-md space-y-4 py-8 px-12">
        <div className="flex flex-col space-y-1">
          <div className="text-lg">
            You were invited to <strong>{name}</strong>
          </div>
          <div className="text-xs">
            Invited by <strong>{inviterEmail}</strong>
          </div>
        </div>
        <div className="flex flex-row space-x-2 text-base">
          {loading ? (
            "Loading..."
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
