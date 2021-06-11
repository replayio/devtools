import React, { ReactElement, useEffect, useState } from "react";
import hooks from "ui/hooks";
import "./Invitations.css";
import { Workspace } from "ui/types";
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
        "relative rounded-lg border bg-white px-6 py-2 shadow-sm flex space-x-3 focus-within:ring-2 focus-within:ring-offset-2"
      )}
    >
      <div className="flex-1 min-w-0 select-none">
        <p className="text-lg font-medium text-gray-900">{teamName}</p>
        <div className="text-lg text-gray-500 truncate space-x-2">{actions}</div>
      </div>
    </div>
  );
}

function Invitation({ workspace, onAccept }: { workspace: Workspace; onAccept: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const acceptPendingInvitation = hooks.useAcceptPendingInvitation(onAccept);
  const rejectPendingInvitation = hooks.useRejectPendingInvitation(onAccept);

  const handleAccept = () => {
    acceptPendingInvitation({ variables: { workspaceId: workspace.id } });
    setIsLoading(true);
  };
  const handleRefuse = () => {
    rejectPendingInvitation({ variables: { workspaceId: workspace.id } });
    setIsLoading(true);
  };

  const actions = isLoading ? (
    <div>Loading...</div>
  ) : (
    <>
      <button onClick={handleRefuse}>Refuse</button>
      <span>/</span>
      <button onClick={handleAccept}>Accept</button>
    </>
  );

  return (
    <InvitationCard
      teamName={workspace.name}
      actions={actions}
      borderStyles={"border-gray-300 hover:border-gray-400 "}
    />
  );
}

function AcceptedInvitation({
  workspace,
  setWorkspaceId,
  hideAcceptedInvitation,
}: {
  workspace: Workspace;
  setWorkspaceId: (id: string) => void;
  hideAcceptedInvitation: (team: Workspace) => void;
}) {
  const [shouldHide, setShouldHide] = useState(false);

  const onHide = () => {
    setShouldHide(true);
  };
  const onGo = () => {
    setShouldHide(true);
    setWorkspaceId(workspace.id);
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
  const [acceptedInvitations, setAcceptedInvitations] = useState<Array<Workspace>>([]);

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

  const hideAcceptedInvitation = (team: Workspace) => {
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
    <div className="workspace-invites flex flex-col space-y-4 p-8 items-start">
      <h2 className="text-gray-500 font-medium uppercase tracking-wide">{`PENDING INVITATIONS`}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {displayedWorkspaces.map(workspace =>
          acceptedInvitations.includes(workspace) ? (
            <AcceptedInvitation
              {...{ workspace, setWorkspaceId, hideAcceptedInvitation }}
              key={workspace.id}
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
