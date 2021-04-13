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
      <div class="relative rounded-lg border border-gray-300 bg-white px-6 py-2 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
        <div class="flex-1 min-w-0">
          <span class="absolute inset-0" aria-hidden="true"></span>
          <p class="text-lg font-medium text-gray-900">{workspace.name}</p>
          <p class="text-lg text-gray-500 truncate">
            <span onClick={() => handleRefuse(workspace.id)}>Refuse</span> /
            <span onClick={() => handleAccept(workspace.id)}> Accept</span>
          </p>
        </div>
      </div>
    </div>
  );
}

type InvitationsProps = PropsFromRedux & {
  pendingWorkspaces: Workspace[];
};

function Invitations({ pendingWorkspaces }: InvitationsProps) {
  return (
    <div className="workspace-invites">
      <h2 class="text-gray-500 font-medium uppercase tracking-wide m-4 ml-12">{`PENDING INVITATIONS`}</h2>
      <div class="grid m-12 mt-0 grid-cols-1 gap-4 sm:grid-cols-3">
        {pendingWorkspaces.map(workspace => (
          <Invitation workspace={workspace} key={workspace.id} />
        ))}
      </div>
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
