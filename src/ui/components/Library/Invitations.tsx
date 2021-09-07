import React, { ReactElement, useEffect, useState } from "react";
import hooks from "ui/hooks";
import "./Invitations.css";
import { PendingWorkspaceInvitation, Workspace } from "ui/types";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import classNames from "classnames";
import TeamButton from "./TeamButton";

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

export default function Invitations({}) {
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  if (loading) {
    return null;
  }

  const displayedWorkspaces = [...pendingWorkspaces!].sort((a, b) =>
    a.name > b.name ? 1 : a.name < b.name ? -1 : 0
  );

  if (displayedWorkspaces.length === 0) {
    return null;
  }

  return (
    <>
      {displayedWorkspaces.map(workspace => (
        <TeamButton id={workspace.id} text={workspace.name} key={workspace.id} isNew />
      ))}
    </>
  );
}
