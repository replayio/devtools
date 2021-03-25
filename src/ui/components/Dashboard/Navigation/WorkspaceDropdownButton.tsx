import React from "react";
import { connect, ConnectedProps } from "react-redux";
import useAuth0 from "ui/utils/useAuth0";
import { selectors } from "ui/reducers";
import "./WorkspaceDropdown.css";
import { UIState } from "ui/state";
import { Workspace } from "ui/types";

type WorkspaceDropdownButtonProps = PropsFromRedux & {
  workspaces: Workspace[];
  personalWorkspaceId: string;
};

function WorkspaceDropdownButton({
  workspaces,
  currentWorkspaceId,
  personalWorkspaceId,
}: WorkspaceDropdownButtonProps) {
  const { user } = useAuth0();
  let picture, title, subtitle;

  // Just render the component if we're in the default personal state to avoid flickering.
  if (!workspaces) {
    return null;
  }

  if (currentWorkspaceId == personalWorkspaceId) {
    picture = <img src={user.picture} />;
    title = "Personal";
    subtitle = user.email;
  } else {
    const displayedWorkspace = workspaces.find(workspace => workspace.id == currentWorkspaceId);
    picture = <div className="material-icons">workspaces</div>;
    title = displayedWorkspace!.name;
    const count = displayedWorkspace?.workspaces_users.filter(wu => !wu.pending).length;
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
