import React, { useState } from "react";
import hooks from "ui/hooks";
import { WorkspaceUser } from "ui/types";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import * as actions from "ui/actions/app";
import { UIState } from "ui/state";
import { NonRegisteredTeamMember } from "ui/hooks/invitations";
const { prefs } = require("ui/utils/prefs");

import "./WorkspaceMember.css";
import MaterialIcon from "../MaterialIcon";

type WorkspaceMemberProps = { member: WorkspaceUser } & PropsFromRedux;

export function NonRegisteredWorkspaceMember({ member }: { member: NonRegisteredTeamMember }) {
  return (
    <li className="workspace-member">
      <MaterialIcon>mail_outline</MaterialIcon>
      <div className="workspace-member-content">
        <div className="title">{member.invitedEmail}</div>
      </div>
      <div className="permission-container">
        <span>Pending</span>
      </div>
    </li>
  );
}

function Role({
  member,
  setWorkspaceId,
  workspaceId,
  hideModal,
}: {
  member: WorkspaceUser;
  setWorkspaceId: any;
  workspaceId: string;
  hideModal: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const deleteUserFromWorkspace = hooks.useDeleteUserFromWorkspace();
  const { userId: localUserId } = hooks.useGetUserId();
  const { userId, membershipId } = member;

  const handleDelete = () => {
    setExpanded(false);

    const leaveMsg = `Are you sure you want to leave this team?`;
    const kickMsg = `Are you sure you want to remove ${member.user!.name} from this team?`;
    const isPersonal = localUserId == userId;
    const message = isPersonal ? leaveMsg : kickMsg;

    if (window.confirm(message)) {
      deleteUserFromWorkspace({ variables: { membershipId } });

      // If the user is the member leaving, hide the modal and go back
      // to the personal workspace.
      if (isPersonal) {
        hideModal();
        setWorkspaceId(null);
        prefs.defaultLibraryTeam = JSON.stringify(null);
      }
    }
  };

  let content = (
    <PortalDropdown
      buttonContent={
        <div className="permission-container">
          <MaterialIcon>expand_more</MaterialIcon>
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
            <MaterialIcon>expand_more</MaterialIcon>
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

function WorkspaceMember({ member, setWorkspaceId, hideModal, workspaceId }: WorkspaceMemberProps) {
  return (
    <li className="workspace-member">
      <img src={member.user!.picture} />
      <div className="workspace-member-content">
        <div className="title">{member.user!.name}</div>
      </div>
      <Role
        member={member}
        setWorkspaceId={setWorkspaceId}
        workspaceId={workspaceId!}
        hideModal={hideModal}
      />
    </li>
  );
}

const connector = connect((state: UIState) => ({ workspaceId: selectors.getWorkspaceId(state) }), {
  setWorkspaceId: actions.setWorkspaceId,
  hideModal: actions.hideModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WorkspaceMember);
