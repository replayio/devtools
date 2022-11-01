import sortBy from "lodash/sortBy";

import hooks from "ui/hooks";

import { TeamButton } from "./TeamButton";

export function Invitations() {
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  if (loading || !pendingWorkspaces || !pendingWorkspaces.length) {
    return null;
  }

  return (
    <>
      {sortBy(pendingWorkspaces, "name").map(workspace => (
        <TeamButton id={workspace.id} label={workspace.name} key={workspace.id} isNew />
      ))}
    </>
  );
}
