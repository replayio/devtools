import React, { useState } from "react";
import PortalDropdown from "../PortalDropdown";
import { Dropdown, DropdownItem, DropdownItemContent } from "ui/components/Library/LibraryDropdown";
import { WorkspaceId } from "ui/state/app";
import { Recording, Workspace } from "ui/types";
import hooks from "ui/hooks";
import MaterialIcon from "../MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";
import { isPublicDisabled } from "ui/utils/org";

const WorkspacePrivacySummary = ({ workspace: { name } }: { workspace: Workspace }) => (
  <span>
    {`Members of `}
    <span className="underline">{name}</span>
    {` can view`}
  </span>
);

export function getPrivacySummaryAndIcon(recording: Recording) {
  if (!recording.private) {
    return { icon: "link", summary: "Anyone with the link can view" };
  }

  if (recording.workspace) {
    return {
      icon: "domain",
      summary: <WorkspacePrivacySummary workspace={recording.workspace} />,
    };
  }

  // If the recording is private and in an individual's library.
  return { icon: "group", summary: "Only people with access can view" };
}

export default function PrivacyDropdown({ recording }: { recording: Recording }) {
  const [expanded, setExpanded] = useState(false);
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace(false);
  const { workspaces } = hooks.useGetNonPendingWorkspaces();
  const workspaceId = recording.workspace?.id || null;
  const isOwner = hooks.useIsOwner(recording.id || "00000000-0000-0000-0000-000000000000");
  const isPrivate = recording.private;
  const toggleIsPrivate = hooks.useToggleIsPrivate(recording.id, isPrivate);

  const setPublic = () => {
    trackEvent("share_modal.set_public");
    if (isPrivate) {
      toggleIsPrivate();
    }
    setExpanded(false);
  };
  const setPrivate = () => {
    trackEvent("share_modal.set_private");
    if (!isPrivate) {
      toggleIsPrivate();
    }
    setExpanded(false);
  };
  const handleMoveToTeam = (targetWorkspaceId: WorkspaceId | null) => {
    if (targetWorkspaceId !== workspaceId) {
      trackEvent("share_modal.set_team");
      updateRecordingWorkspace(recording.id, workspaceId, targetWorkspaceId);
    }

    setPrivate();
    setExpanded(false);
  };

  const { summary } = getPrivacySummaryAndIcon(recording);

  const button = (
    <div className="flex flex-row space-x-1">
      <span className="text-xs overflow-hidden overflow-ellipsis whitespace-pre">{summary}</span>
      {isOwner ? (
        <div style={{ lineHeight: "0px" }}>
          <MaterialIcon>expand_more</MaterialIcon>
        </div>
      ) : null}
    </div>
  );

  if (!isOwner) {
    return (
      <button disabled className="cursor-default" title="Only the owner can modify these settings">
        {button}
      </button>
    );
  }

  return (
    <PortalDropdown
      buttonContent={button}
      buttonStyle={"overflow-hidden"}
      setExpanded={setExpanded}
      expanded={expanded}
      distance={0}
      position="bottom-right"
    >
      <Dropdown menuItemsClassName="z-50 overflow-auto max-h-48" widthClass="w-80">
        {isPublicDisabled(workspaces, workspaceId) ? null : (
          <DropdownItem onClick={setPublic}>
            <DropdownItemContent icon="link" selected={!isPrivate}>
              Anyone with the link
            </DropdownItemContent>
          </DropdownItem>
        )}
        <DropdownItem onClick={() => handleMoveToTeam(null)}>
          <DropdownItemContent icon="domain" selected={isPrivate && !workspaceId}>
            Only people with access
          </DropdownItemContent>
        </DropdownItem>
        <div>
          {workspaces.map(({ id, name }) => (
            <DropdownItem onClick={() => handleMoveToTeam(id)} key={id}>
              <DropdownItemContent icon="group" selected={isPrivate && id === workspaceId}>
                <span className="overflow-hidden overflow-ellipsis whitespace-pre">
                  Members of {name}
                </span>
              </DropdownItemContent>
            </DropdownItem>
          ))}
        </div>
      </Dropdown>
    </PortalDropdown>
  );
}
