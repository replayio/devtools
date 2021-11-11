import React from "react";
import hooks from "ui/hooks";
import sortBy from "lodash/sortBy";

import TeamButton from "./TeamButton";

export default function Invitations({}) {
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  if (loading || !pendingWorkspaces || !pendingWorkspaces.length) {
    return null;
  }

  return (
    <>
      {sortBy(pendingWorkspaces, "name").map(workspace => (
        <TeamButton id={workspace.id} text={workspace.name} key={workspace.id} isNew />
      ))}
    </>
  );
}
