import React, { useState } from "react";
import classnames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { getUserId } from "ui/utils/useToken";
import "./Invitations.css";
import { Workspace } from "ui/types";

function Invitation({ workspace }: { workspace: Workspace }) {
  const [isLoading, setIsLoading] = useState(false);

  const userId = getUserId();
  const acceptPendingInvitation = hooks.useAcceptPendingInvitation();
  const deleteUserFromWorkspace = hooks.useDeleteUserFromWorkspace();

  const handleAccept = (workspaceId: string) => {
    acceptPendingInvitation({
      variables: { workspaceId, userId },
    });
    setIsLoading(true);
  };
  const handleRefuse = (workspaceId: string) => {
    deleteUserFromWorkspace({
      variables: { userId, workspaceId },
    });
    setIsLoading(true);
  };

  return (
    <div className={classnames("left-sidebar-menu-item")}>
      <span className="material-icons">description</span>
      <span className="label">{workspace.name}</span>
      {isLoading ? (
        <div>Loading</div>
      ) : (
        <div className="actions">
          <span onClick={() => handleRefuse(workspace.id)}>Refuse</span>
          <span onClick={() => handleAccept(workspace.id)}>Accept</span>
        </div>
      )}
    </div>
  );
}

type InvitationsProps = PropsFromRedux & {
  pendingWorkspaces: Workspace[];
};

function Invitations({ pendingWorkspaces }: InvitationsProps) {
  return (
    <div className="workspace-invites">
      <div className="navigation-subheader">{`INVITATIONS (${pendingWorkspaces.length})`}</div>
      {pendingWorkspaces.map(workspace => (
        <Invitation workspace={workspace} key={workspace.id} />
      ))}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  { setModal: actions.setModal }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Invitations);
