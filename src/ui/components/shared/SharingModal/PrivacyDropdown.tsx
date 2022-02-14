import React, { Dispatch, ReactNode, SetStateAction, useState } from "react";
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
    <span className="font-bold">{name}</span>
    {` can view`}
  </span>
);

export function getPrivacySummaryAndIcon(recording: Recording) {
  if (!recording.private) {
    return { icon: "globe", summary: "Anyone with the link can view" };
  }

  if (recording.workspace) {
    return {
      icon: "group",
      summary: <WorkspacePrivacySummary workspace={recording.workspace} />,
    };
  }

  // If the recording is private and in an individual's library.
  return { icon: "lock", summary: "Only people with access can view" };
}

function DropdownButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-row space-x-1">
      <span className="text-xs whitespace-pre">{children}</span>
      {!disabled ? (
        <div style={{ lineHeight: "0px" }}>
          <MaterialIcon>expand_more</MaterialIcon>
        </div>
      ) : null}
    </div>
  );
}

function useGetPrivacyOptions(
  recording: Recording,
  setExpanded: Dispatch<SetStateAction<boolean>>
) {
  const isPrivate = recording.private;
  const workspaceId = recording.workspace?.id || null;
  const { workspaces } = hooks.useGetNonPendingWorkspaces();
  const isOwner = hooks.useIsOwner();

  const userBelongsToTeam = workspaceId && workspaces.find(w => w.id === workspaceId);

  const updateIsPrivate = hooks.useUpdateIsPrivate();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace(false);

  const options: ReactNode[] = [];

  const toggleIsPrivate = () => updateIsPrivate(recording.id, !isPrivate);
  const setPublic = () => {
    trackEvent("share_modal.set_public");
    if (isPrivate) {
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
  const setPrivate = () => {
    trackEvent("share_modal.set_private");
    if (!isPrivate) {
      toggleIsPrivate();
    }
    setExpanded(false);
  };

  if (!isPublicDisabled(workspaces, workspaceId)) {
    options.push(
      <DropdownItem onClick={setPublic} key="option-public">
        <DropdownItemContent icon="globe" selected={!isPrivate}>
          <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
            Anyone with the link
          </span>
        </DropdownItemContent>
      </DropdownItem>
    );
  }

  if (isOwner) {
    // This gives the user who owns the recording the option to move the recording
    // to their library, or any team they belong to.
    options.push(
      <DropdownItem onClick={() => handleMoveToTeam(null)} key="option-private">
        <DropdownItemContent icon="lock" selected={isPrivate && !workspaceId}>
          <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
            Only people with access
          </span>
        </DropdownItemContent>
      </DropdownItem>,
      <div key="option-team">
        {workspaces.map(({ id, name }) => (
          <DropdownItem onClick={() => handleMoveToTeam(id)} key={id}>
            <DropdownItemContent icon="group" selected={isPrivate && id === workspaceId}>
              <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
                Members of {name}
              </span>
            </DropdownItemContent>
          </DropdownItem>
        ))}
      </div>
    );
  } else if (userBelongsToTeam) {
    // This gives a user who belongs to the replay's team an option to set it to private
    // without moving the replay's team.
    options.push(
      <DropdownItem onClick={setPrivate} key="option-private">
        <DropdownItemContent icon="group" selected={isPrivate}>
          <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
            Members of {recording.workspace?.name || "this team"}
          </span>
        </DropdownItemContent>
      </DropdownItem>
    );
  }

  return options;
}

export default function PrivacyDropdown({ recording }: { recording: Recording }) {
  const workspaceId = recording.workspace?.id || null;
  const [expanded, setExpanded] = useState(false);
  const privacyOptions = useGetPrivacyOptions(recording, setExpanded);
  const { summary } = getPrivacySummaryAndIcon(recording);

  if (privacyOptions.length <= 1) {
    return (
      <div
        title={
          workspaceId
            ? "Only team members can can modify these settings"
            : "Only the owner can modify these settings"
        }
      >
        <DropdownButton disabled>{summary}</DropdownButton>
      </div>
    );
  }

  return (
    <PortalDropdown
      buttonContent={<DropdownButton>{summary}</DropdownButton>}
      buttonStyle={"overflow-hidden"}
      setExpanded={setExpanded}
      expanded={expanded}
      distance={0}
      position="bottom-right"
    >
      <Dropdown menuItemsClassName="z-50 overflow-auto max-h-48" widthClass="w-80">
        {privacyOptions}
      </Dropdown>
    </PortalDropdown>
  );
}
