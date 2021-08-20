import classnames from "classnames";
import React, { useState } from "react";
import hooks from "ui/hooks";
import { WorkspaceUser, WorkspaceUserRole } from "ui/types";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";

import "./WorkspaceMember.css";
import MaterialIcon from "../MaterialIcon";
import { useEffect } from "react";

type WorkspaceMemberProps = { member: WorkspaceUser; isAdmin: boolean } & PropsFromRedux;

const memberRoleLabels: Record<WorkspaceUserRole, string> = {
  admin: "Admin",
  debugger: "Developer",
  viewer: "User",
};

function getMemberRole(member: WorkspaceUser) {
  return (
    (member.roles?.includes("admin") && "admin") ||
    (member.roles?.includes("debugger") && "debugger") ||
    "viewer"
  );
}

function WorkspaceMemberRoleOption({
  value,
  selected,
  onSelect,
}: {
  value: WorkspaceUserRole;
  selected: WorkspaceUserRole;
  onSelect: (value: WorkspaceUserRole) => void;
}) {
  const isSelected = selected === value;
  return (
    <label
      className={classnames("permissions-dropdown-item block", {
        "font-bold": isSelected,
      })}
    >
      <input
        type="radio"
        name="workspaceUserRole"
        className="h-0 w-0 opacity-0"
        value={value}
        checked={isSelected}
        onChange={e => e.target.checked && onSelect(value)}
      />
      <span>{memberRoleLabels[value]}</span>
    </label>
  );
}

function WorkspaceMemberRoles({ member }: { member: WorkspaceUser }) {
  const role: WorkspaceUserRole = getMemberRole(member);
  const { updateWorkspaceMemberRole } = hooks.useUpdateWorkspaceMemberRole();
  const [selectedRole, setSelectedRole] = useState<WorkspaceUserRole>(role);

  useEffect(() => setSelectedRole(role), [role]);

  const selectRole = (updated: WorkspaceUserRole) => {
    const roles: WorkspaceUserRole[] = ["viewer"];
    if (updated === "admin") {
      roles.push("debugger");
      roles.push("admin");
    } else if (updated === "debugger") {
      roles.push("debugger");
    }

    setSelectedRole(updated);
    updateWorkspaceMemberRole({
      variables: {
        id: member.membershipId,
        roles,
      },
    }).catch(e => {
      console.error(e);
      setSelectedRole(selectedRole);
    });
  };

  return (
    <div>
      <WorkspaceMemberRoleOption value="viewer" onSelect={selectRole} selected={selectedRole} />
      <WorkspaceMemberRoleOption value="debugger" onSelect={selectRole} selected={selectedRole} />
      <WorkspaceMemberRoleOption value="admin" onSelect={selectRole} selected={selectedRole} />
    </div>
  );
}

function Status({ member, hideArrow = false }: { member: WorkspaceUser; hideArrow?: boolean }) {
  return (
    <div className={classnames("flex flex-row items-center group", { italic: member.pending })}>
      <span>
        {memberRoleLabels[getMemberRole(member)]}
        {member.pending ? " (pending)" : ""}
      </span>
      <MaterialIcon
        className={classnames("material-icons opacity-0", {
          "group-hover:opacity-100": !hideArrow,
        })}
      >
        expand_more
      </MaterialIcon>
    </div>
  );
}

export function NonRegisteredWorkspaceMember({
  member,
  isAdmin,
}: {
  member: WorkspaceUser;
  isAdmin: boolean;
}) {
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
      {isAdmin ? (
        <PortalDropdown
          buttonContent={<Status member={member} />}
          setExpanded={setExpanded}
          expanded={expanded}
          buttonStyle=""
          position="bottom-right"
        >
          <WorkspaceMemberRoles member={member} />
          <hr />
          <div className="permissions-dropdown-item" onClick={handleDelete}>
            Remove
          </div>
        </PortalDropdown>
      ) : (
        <Status member={member} hideArrow />
      )}
    </li>
  );
}

function Role({
  member,
  setWorkspaceId,
  hideModal,
  isAdmin,
}: {
  member: WorkspaceUser;
  setWorkspaceId: any;
  hideModal: any;
  isAdmin: boolean;
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

  if (!isAdmin && localUserId !== userId) {
    return <Status member={member} hideArrow />;
  }

  return (
    <PortalDropdown
      buttonContent={<Status member={member} />}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle=""
      position="bottom-right"
    >
      {isAdmin && localUserId !== userId ? <WorkspaceMemberRoles member={member} /> : null}
      <hr />
      <div className="permissions-dropdown-item" onClick={handleDelete}>
        {member.pending ? "Cancel" : localUserId == userId ? "Leave" : "Remove"}
      </div>
    </PortalDropdown>
  );
}

function WorkspaceMember({ member, setWorkspaceId, hideModal, isAdmin }: WorkspaceMemberProps) {
  return (
    <li className="flex flex-row items-center space-x-2">
      <img
        src={member.user!.picture}
        className="rounded-full"
        style={{ width: "28px", height: "28px" }}
      />
      <div className="flex-grow">{member.user!.name}</div>
      <Role
        member={member}
        setWorkspaceId={setWorkspaceId}
        hideModal={hideModal}
        isAdmin={isAdmin}
      />
    </li>
  );
}

const connector = connect(() => ({}), {
  setWorkspaceId: actions.setWorkspaceId,
  hideModal: actions.hideModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WorkspaceMember);
