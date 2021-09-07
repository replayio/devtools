import React, { ReactElement, useEffect, useState } from "react";
import hooks from "ui/hooks";
import "./Invitations.css";
import { PendingWorkspaceInvitation, Workspace } from "ui/types";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import classNames from "classnames";

function InvitationCard({
  actions,
  teamName,
  borderStyles,
}: {
  actions: ReactElement[] | ReactElement;
  teamName: string;
  borderStyles: string;
}) {
  return (
    <div
      className={classNames(
        borderStyles,
        "relative bg-gray-900 py-2 shadow-sm flex space-x-2.5 focus-within:ring-2 focus-within:ring-offset-2"
      )}
    >
      <div className="flex-1 min-w-0 select-none">
        <div className="font-medium text-white overflow-hidden overflow-ellipsis whitespace-pre">
          {teamName}
        </div>
        <div className="text-xs truncate space-x-1.5">{actions}</div>
      </div>
    </div>
  );
}

function Invitation({ workspace, onAccept }: { workspace: Workspace; onAccept: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const acceptPendingInvitation = hooks.useAcceptPendingInvitation(onAccept);
  const rejectPendingInvitation = hooks.useRejectPendingInvitation(() => {});

  const handleAccept = () => {
    acceptPendingInvitation({ variables: { workspaceId: workspace.id } });
    setIsLoading(true);
  };
  const handleDecline = () => {
    rejectPendingInvitation({ variables: { workspaceId: workspace.id } });
    setIsLoading(true);
  };

  const actions = isLoading ? (
    <div>Loading...</div>
  ) : (
    <>
      <button onClick={handleDecline} className="hover:underline">
        Decline
      </button>
      <span>/</span>
      <button onClick={handleAccept} className="hover:underline">
        Accept
      </button>
    </>
  );

  return (
    <InvitationCard
      teamName={workspace.name}
      actions={actions}
      borderStyles={"border-textFieldBorder hover:border-textFieldBorder "}
    />
  );
}

function AcceptedInvitation({
  workspace,
  setWorkspaceId,
  hideAcceptedInvitation,
}: {
  workspace: PendingWorkspaceInvitation;
  setWorkspaceId: (id: string) => void;
  hideAcceptedInvitation: (team: PendingWorkspaceInvitation) => void;
}) {
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const [shouldHide, setShouldHide] = useState(false);

  const onHide = () => {
    setShouldHide(true);
  };
  const onGo = () => {
    setShouldHide(true);
    setWorkspaceId(workspace.id);
    updateDefaultWorkspace({ variables: { workspaceId: workspace.id } });
  };

  useEffect(() => {
    if (shouldHide) {
      hideAcceptedInvitation(workspace);
    }
  }, [shouldHide]);

  const actions = (
    <>
      <button onClick={onHide}>Hide</button>
      <span>/</span>
      <button onClick={onGo}>Go to team</button>
    </>
  );

  return (
    <InvitationCard
      teamName={workspace.name}
      actions={actions}
      borderStyles={"border-blue-300 hover:border-blue-400 "}
    />
  );
}

function Invitations({ setWorkspaceId }: PropsFromRedux) {
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();
  const [acceptedInvitations, setAcceptedInvitations] = useState<Array<PendingWorkspaceInvitation>>(
    []
  );

  if (loading) {
    return null;
  }

  const displayedAcceptedInvitations = acceptedInvitations.filter(
    workspace => pendingWorkspaces && !pendingWorkspaces.includes(workspace)
  );
  const displayedWorkspaces = [
    ...pendingWorkspaces!,
    ...displayedAcceptedInvitations,
  ].sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));

  if (displayedWorkspaces.length === 0) {
    return null;
  }

  const hideAcceptedInvitation = (team: PendingWorkspaceInvitation) => {
    const invitationIndex = acceptedInvitations.indexOf(team);

    if (invitationIndex < 0) {
      console.error("Can't find the index for that accepted invitation");
      return;
    }

    const newAcceptedInvitations = [...acceptedInvitations].slice();
    newAcceptedInvitations.splice(invitationIndex, 1);

    setAcceptedInvitations(newAcceptedInvitations);
  };

  return (
    <div className="workspace-invites flex flex-col space-y-2 p-4 items-start text-sm bg-gray-900">
      <h2 className="font-medium uppercase text-xs">{`Team Invitations`}</h2>
      <div className="flex flex-col">
        {displayedWorkspaces.map(workspace =>
          acceptedInvitations.includes(workspace) ? (
            <AcceptedInvitation
              {...{ workspace, setWorkspaceId, hideAcceptedInvitation }}
              key={`${workspace.id}-accepted`}
            />
          ) : (
            <Invitation
              workspace={workspace}
              key={workspace.id}
              onAccept={() => setAcceptedInvitations([...acceptedInvitations, workspace])}
            />
          )
        )}
      </div>
    </div>
  );
}

const connector = connect(() => ({}), { setWorkspaceId: actions.setWorkspaceId });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Invitations);
