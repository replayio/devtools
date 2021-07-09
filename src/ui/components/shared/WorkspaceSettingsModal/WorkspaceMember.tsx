import React, { useState } from "react";
import hooks from "ui/hooks";
import { WorkspaceUser } from "ui/types";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";

import "./WorkspaceMember.css";
import MaterialIcon from "../MaterialIcon";

type WorkspaceMemberProps = { member: WorkspaceUser } & PropsFromRedux;

function Status({ children }: { children: string }) {
  return (
    <div className="flex flex-row items-center group">
      <MaterialIcon className="material-icons opacity-0 group-hover:opacity-100">
        expand_more
      </MaterialIcon>
      <span>{children}</span>
    </div>
  );
}

export function NonRegisteredWorkspaceMember({ member }: { member: WorkspaceUser }) {
  const deleteUserFromWorkspace = hooks.useDeleteUserFromWorkspace();
  const [expanded, setExpanded] = useState(false);

  const handleDelete = () => {
    setExpanded(false);
    const message = `Are you sure you want to remove ${member.email} from this team?`;

    if (window.confirm(message)) {
      deleteUserFromWorkspace({ variables: { membershipId: member.membershipId } });
    }
  };

  return (
    <li className="flex flex-row items-center space-x-2">
      <div className="grid justify-center items-center" style={{ width: "28px", height: "28px" }}>
        <MaterialIcon className="text-3xl">mail_outline</MaterialIcon>
      </div>
      <div className="flex-grow">{member.email}</div>
      <PortalDropdown
        buttonContent={<Status>Pending</Status>}
        setExpanded={setExpanded}
        expanded={expanded}
        buttonStyle=""
        position="bottom-right"
      >
        <div className="permissions-dropdown-item" onClick={handleDelete}>
          Remove
        </div>
      </PortalDropdown>
    </li>
  );
}

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
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
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
        updateDefaultWorkspace({ variables: { workspaceId: null } });
      }
    }
  };

  let content = (
    <PortalDropdown
      buttonContent={<Status>Admin</Status>}
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
        buttonContent={<Status>Pending</Status>}
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

  return content;
}

function WorkspaceMember({ member, setWorkspaceId, hideModal }: WorkspaceMemberProps) {
  return (
    <li className="flex flex-row items-center space-x-2">
      <img
        src={member.user!.picture}
        className="rounded-full"
        style={{ width: "28px", height: "28px" }}
      />
      <div className="flex-grow">{member.user!.name}</div>
      <Role member={member} setWorkspaceId={setWorkspaceId} hideModal={hideModal} />
    </li>
  );
}

const connector = connect(() => ({}), {
  setWorkspaceId: actions.setWorkspaceId,
  hideModal: actions.hideModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WorkspaceMember);
