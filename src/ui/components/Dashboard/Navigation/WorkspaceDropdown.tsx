import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Dropdown from "ui/components/shared/Dropdown";
import "./WorkspaceDropdown.css";
import NewWorkspaceButton from "./NewWorkspaceButton";
import WorkspaceItem from "./WorkspaceItem";
import WorkspaceDropdownButton from "./WorkspaceDropdownButton";
import hooks from "ui/hooks";

export default function WorkspaceDropdown() {
  const [expanded, setExpanded] = useState(false);
  const { workspaces } = hooks.useGetWorkspaces();
  const { user } = useAuth0();

  console.log(workspaces);

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
          workspaces.map((workspace: any) => {
            const count = workspace?.workspaces_users_aggregate?.aggregate.count;

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
