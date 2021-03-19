import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import { selectors } from "ui/reducers";
import "./WorkspaceDropdown.css";
import { UIState } from "ui/state";
import { Workspace } from "ui/hooks/workspaces";

type WorkspaceDropdownButtonProps = PropsFromRedux & {
  workspaces: Workspace[];
};

function WorkspaceDropdownButton({ workspaces, currentWorkspaceId }: WorkspaceDropdownButtonProps) {
  const { user } = useAuth0();
  let picture, title, subtitle;

  if (!workspaces) {
    return null;
  }

  if (currentWorkspaceId == "personal") {
    picture = <img src={user.picture} />;
    title = "Personal";
    subtitle = user.email;
  } else {
    const displayedWorkspace = workspaces.find(workspace => workspace.id == currentWorkspaceId);
    picture = <div className="material-icons">workspaces</div>;
    title = displayedWorkspace!.name;
    const count = displayedWorkspace?.workspaces_users_aggregate?.aggregate.count;
    subtitle = `Workspace - ${count} member${count == 1 ? "" : "s"}`;
  }

  return (
    <div className="workspace-dropdown-button">
      {picture}
      <div className="workspace-profile-content">
        <div className="title">{title}</div>
        <div className="subtitle">{subtitle}</div>
      </div>
      <div className="material-icons">unfold_more</div>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  currentWorkspaceId: selectors.getWorkspaceId(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(WorkspaceDropdownButton);
