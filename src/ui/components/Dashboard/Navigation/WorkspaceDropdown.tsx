import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Dropdown from "ui/components/shared/Dropdown";
import "./WorkspaceDropdown.css";
import NewWorkspaceButton from "./NewWorkspaceButton";
import WorkspaceItem from "./WorkspaceItem";
import WorkspaceDropdownButton from "./WorkspaceDropdownButton";
import hooks from "ui/hooks";
import { Workspace } from "ui/hooks/workspaces";
import useToken from "ui/utils/useToken";

export default function WorkspaceDropdown() {
  const [expanded, setExpanded] = useState(false);
  const { workspaces } = hooks.useGetNonPendingWorkspaces();
  const { user } = useAuth0();
  const { claims } = useToken();
  const userId = claims?.hasura.userId;

  console.log("workspacedropdown");
  return (
    <div className="workspace-dropdown-container">
      <Dropdown
        buttonContent={<WorkspaceDropdownButton {...{ workspaces }} />}
        setExpanded={setExpanded}
        expanded={expanded}
        orientation="bottom"
      >
        <WorkspaceItem
          icon={<img src={user.picture} />}
          title="Personal"
          subtitle={user.email}
          setExpanded={setExpanded}
          workspaceId="personal"
        />
        {workspaces &&
          workspaces.map((workspace: Workspace) => {
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
