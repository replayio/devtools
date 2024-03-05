import classnames from "classnames";
import React, { useEffect, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { WorkspaceUser, WorkspaceUserRole } from "shared/graphql/types";
import * as actions from "ui/actions/app";
import { AvatarImage } from "ui/components/Avatar";
import { Dropdown, DropdownDivider, DropdownItem } from "ui/components/Library/LibraryDropdown";
import { useRedirectToTeam } from "ui/components/Library/Team/utils";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import hooks from "ui/hooks";

import { useConfirm } from "../Confirm";
import MaterialIcon from "../MaterialIcon";

type WorkspaceMemberProps = {
  member: WorkspaceUser;
  isAdmin: boolean;
  canLeave?: boolean;
} & PropsFromRedux;

const memberRoleLabels: Record<WorkspaceUserRole, string> = {
  admin: "Admin",
  // Not presented in the UI yet
  contributor: "Contributor",
  debugger: "Developer",
  viewer: "User",
};

function getPrimaryMemberRole(member: WorkspaceUser) {
  const roles = getMemberRoles(member);
  return roles.includes("debugger") ? "debugger" : "viewer";
}

function getMemberRoles(member: WorkspaceUser) {
  return member.roles ?? ["viewer"];
}

function getIsAdmin(member: WorkspaceUser) {
  return member.roles?.includes("admin") || false;
}

function WorkspaceMemberRoleOption({
  value,
  selected,
  disabled,
  onSelect,
}: {
  value: WorkspaceUserRole;
  selected: boolean;
  disabled?: boolean;
  onSelect: (selected: boolean, value: WorkspaceUserRole) => void;
}) {
  return (
    <label
      className={classnames("permissions-dropdown-item block flex flex-row items-center", {
        "opacity-50": disabled,
      })}
    >
      <input
        type={value == "admin" ? "checkbox" : "radio"}
        name="workspaceUserRole"
        className="center mx-1 my-0 appearance-none checked:bg-blue-500 indeterminate:bg-gray-300"
        value={value}
        checked={selected}
        disabled={disabled}
        onChange={e => onSelect(!selected, value)}
      />
      <span className="pl-2">{memberRoleLabels[value]}</span>
    </label>
  );
}

function WorkspaceMemberRoles({
  isAdmin,
  member,
  onClick,
}: {
  isAdmin: boolean;
  member: WorkspaceUser;
  onClick: () => void;
}) {
  const roles: WorkspaceUserRole[] = getMemberRoles(member);
  const memberIsAdmin = getIsAdmin(member);
  const { updateWorkspaceMemberRole } = hooks.useUpdateWorkspaceMemberRole();
  const [loading, setLoading] = useState(false);

  const updateRoles = (roles: string[]) => {
    setLoading(true);

    updateWorkspaceMemberRole({
      variables: {
        id: member.membershipId,
        roles,
      },
    })
      .catch(e => {
        console.error(e);
      })
      .finally(() => {
        setLoading(false);
        onClick();
      });
  };

  const selectViewerRole = (selected: boolean) => {
    // when switching to viewer role, we remove debugger
    if (selected) {
      updateRoles(roles.filter(r => r !== "debugger"));
    }
  };

  const selectDebuggerRole = (selected: boolean) => {
    // when switching to debugger role, we add debugger but retain viewer
    // because all members should have the viewer role
    if (selected) {
      updateRoles([...roles, "debugger"]);
    }
  };

  const toggleAdminRole = (selected: boolean) => {
    if (selected) {
      updateRoles([...roles, "admin"]);
    } else {
      updateRoles(roles.filter(r => r !== "admin"));
    }
  };

  return (
    <div>
      <WorkspaceMemberRoleOption
        value="viewer"
        onSelect={selectViewerRole}
        disabled={loading}
        selected={!roles.includes("debugger")}
      />
      <WorkspaceMemberRoleOption
        value="debugger"
        onSelect={selectDebuggerRole}
        disabled={loading}
        selected={roles.includes("debugger")}
      />
      {isAdmin ? (
        <WorkspaceMemberRoleOption
          value="admin"
          onSelect={toggleAdminRole}
          disabled={loading}
          selected={memberIsAdmin}
        />
      ) : null}
    </div>
  );
}

function Status({
  member,
  hideArrow = false,
  title,
}: {
  member: WorkspaceUser;
  hideArrow?: boolean;
  title?: string;
}) {
  return (
    <div
      className={classnames("flex flex-row items-center", { italic: member.pending })}
      title={title}
    >
      <span className="whitespace-pre">
        {memberRoleLabels[getPrimaryMemberRole(member)]}
        {member.pending ? " (pending)" : ""}
      </span>
      <MaterialIcon
        className={classnames("material-icons opacity-0", {
          "group-hover:opacity-100": !hideArrow,
        })}
        iconSize="xl"
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
  const { confirmDestructive } = useConfirm();

  const handleDelete = () => {
    setExpanded(false);
    confirmDestructive({
      message: "Remove team member?",
      description: `Are you sure you want to remove ${member.email} from this team?`,
      acceptLabel: "Remove them",
    }).then(confirmed => {
      if (confirmed) {
        deleteUserFromWorkspace({ variables: { membershipId: member.membershipId } });
      }
    });
  };

  return (
    <li className="flex flex-row items-center space-x-1.5">
      <div className="grid items-center justify-center" style={{ width: "28px", height: "28px" }}>
        <MaterialIcon iconSize="xl">mail_outline</MaterialIcon>
      </div>
      <div className="flex-grow overflow-hidden overflow-ellipsis whitespace-pre">
        {member.email}
      </div>
      <div className="flex-shrink">
        <PortalDropdown
          buttonContent={<Status member={member} />}
          setExpanded={setExpanded}
          expanded={expanded}
          buttonStyle="group"
          position="bottom-right"
        >
          <Dropdown>
            <WorkspaceMemberRoles
              member={member}
              isAdmin={isAdmin}
              onClick={() => setExpanded(false)}
            />
            <DropdownDivider />
            <DropdownItem onClick={handleDelete}>Remove</DropdownItem>
          </Dropdown>
        </PortalDropdown>
      </div>
    </li>
  );
}

function Role({
  canLeave,
  member,
  hideModal,
  isAdmin,
}: {
  member: WorkspaceUser;
  hideModal: any;
  isAdmin: boolean;
  canLeave: boolean;
}) {
  const redirectToTeam = useRedirectToTeam(true);
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
        updateDefaultWorkspace({ variables: { workspaceId: null } });
        redirectToTeam("me");
      }
    }
  };

  if (!canLeave) {
    return (
      <Status
        member={member}
        hideArrow
        title="Promote another team member to admin in order to leave this team"
      />
    );
  }

  return (
    <PortalDropdown
      buttonContent={<Status member={member} />}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle="group"
      position="bottom-right"
    >
      <Dropdown>
        {localUserId !== userId ? (
          <>
            <WorkspaceMemberRoles
              member={member}
              isAdmin={isAdmin}
              onClick={() => setExpanded(false)}
            />
            <DropdownDivider />
          </>
        ) : null}
        <DropdownItem onClick={handleDelete}>
          {member.pending ? "Cancel" : localUserId == userId ? "Leave" : "Remove"}
        </DropdownItem>
      </Dropdown>
    </PortalDropdown>
  );
}

function WorkspaceMember({ member, hideModal, isAdmin, canLeave = false }: WorkspaceMemberProps) {
  return (
    <li className="flex flex-row items-center space-x-1.5">
      <AvatarImage
        src={member.user!.picture}
        className="avatar rounded-full"
        style={{ width: "28px", height: "28px" }}
      />
      <div className="flex-grow overflow-hidden overflow-ellipsis whitespace-pre" data-private>
        {member.user!.name}
      </div>
      <div className="flex-shrink">
        <Role member={member} hideModal={hideModal} isAdmin={isAdmin} canLeave={canLeave} />
      </div>
    </li>
  );
}

const connector = connect(null, {
  hideModal: actions.hideModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WorkspaceMember);
