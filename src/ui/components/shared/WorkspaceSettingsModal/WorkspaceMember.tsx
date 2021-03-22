import React, { useState } from "react";
import hooks from "ui/hooks";
import { WorkspaceUser } from "ui/hooks/workspaces";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import useToken from "ui/utils/useToken";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";

import "./WorkspaceMember.css";

type WorkspaceMemberProps = { member: WorkspaceUser } & PropsFromRedux;

function Role({
  member,
  setWorkspaceId,
  hideModal,
}: {
  member: WorkspaceUser;
  setWorkspaceId: any;
  hideModal: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const deleteUserFromWorkspace = hooks.useDeleteUserFromWorkspace();
  const { claims } = useToken();
  const localUserId = claims?.hasura.userId;
  const { user_id: userId, workspace_id: workspaceId } = member;

  const handleDelete = () => {
    setWorkspaceId("personal");
    hideModal();
    deleteUserFromWorkspace({
      variables: { userId, workspaceId },
    });
  };

  let content = (
    <PortalDropdown
      buttonContent={
        <div className="permission-container">
          <span className="material-icons">expand_more</span>
          <span>Admin</span>
        </div>
      }
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle=""
      position="bottom-right"
    >
      <div className="permissions-dropdown-item" onClick={handleDelete}>
        {localUserId == userId ? "Leave" : "Remove"}
      </div>
    </PortalDropdown>
  );

  if (member.pending) {
    content = (
      <PortalDropdown
        buttonContent={
          <div className="permission-container">
            <span className="material-icons">expand_more</span>
            <span>Pending</span>
          </div>
        }
        setExpanded={setExpanded}
        expanded={expanded}
        buttonStyle=""
        position="bottom-right"
      >
        <div className="permissions-dropdown-item" onClick={handleDelete}>
          Cancel
        </div>
      </PortalDropdown>
    );
  }

  return <div className="member-permissions">{content}</div>;
}

function WorkspaceMember({ member, setWorkspaceId, hideModal }: WorkspaceMemberProps) {
  return (
    <li className="workspace-member">
      <img src={member.user.picture} />
      <div className="workspace-member-content">
        <div className="title">{member.user.name}</div>
        <div className="subtitle">{member.user.email}</div>
      </div>
      <Role member={member} setWorkspaceId={setWorkspaceId} hideModal={hideModal} />
    </li>
  );
}

const connector = connect((state: UIState) => ({ workspaceId: selectors.getWorkspaceId(state) }), {
  setWorkspaceId: actions.setWorkspaceId,
  hideModal: actions.hideModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WorkspaceMember);
