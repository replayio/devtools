import React from "react";
import hooks from "ui/hooks";
import TeamButton from "./TeamButton";

export default function Invitations({}) {
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  if (loading) {
    return null;
  }

  const displayedWorkspaces = [...(pendingWorkspaces || [])].sort((a, b) =>
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
