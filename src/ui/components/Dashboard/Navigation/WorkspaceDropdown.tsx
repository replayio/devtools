import React, { useState } from "react";
import Dropdown from "ui/components/shared/Dropdown";
import "./WorkspaceDropdown.css";
import NewWorkspaceButton from "./NewWorkspaceButton";
import WorkspaceItem from "./WorkspaceItem";
import WorkspaceDropdownButton from "./WorkspaceDropdownButton";
import hooks from "ui/hooks";
import useToken from "ui/utils/useToken";
import useAuth0 from "ui/utils/useAuth0";
import { Workspace } from "ui/types";

export default function WorkspaceDropdown({
  nonPendingWorkspaces,
}: {
  nonPendingWorkspaces: Workspace[];
}) {
  const [expanded, setExpanded] = useState(false);
  const workspaces = nonPendingWorkspaces;
  const { user } = useAuth0();
  const { claims } = useToken();
  const userId = claims?.hasura.userId;

  const sharedWorkspaces = workspaces.filter(workspace => !workspace.is_personal);

  return (
    <div className="workspace-dropdown-container">
      <Dropdown
        buttonContent={<WorkspaceDropdownButton {...{ workspaces: workspaces! }} />}
        setExpanded={setExpanded}
        expanded={expanded}
        orientation="bottom"
      >
        <WorkspaceItem
          icon={<img src={user.picture} />}
          title={"Personal"}
          subtitle={`Personal Workspace`}
          setExpanded={setExpanded}
          workspaceId={null}
        />
        {sharedWorkspaces.map(workspace => {
          const count = workspace?.workspaces_users.filter(wu => !wu.pending).length;
          const isPending = workspace?.workspaces_users.find(wu => wu.user_id == userId)?.pending;

          if (isPending) {
            return null;
          }

          return (
            <WorkspaceItem
              icon={<div className="material-icons">workspaces</div>}
              title={workspace.name}
              subtitle={`Workspace - ${count} member${count == 1 ? "" : "s"}`}
              setExpanded={setExpanded}
              workspaceId={workspace.id}
              key={workspace.id}
            />
          );
        })}
        <NewWorkspaceButton setExpanded={setExpanded} />
      </Dropdown>
    </div>
  );
}
