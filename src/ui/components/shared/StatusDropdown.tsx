import ReactCanvasConfetti from "react-canvas-confetti";
import React, { Dispatch, ReactNode, SetStateAction, useState } from "react";
import PortalDropdown from "./PortalDropdown";
import { Dropdown, DropdownItem, DropdownItemContent } from "ui/components/Library/LibraryDropdown";
import { WorkspaceId } from "ui/state/app";
import { Recording, Workspace } from "ui/types";
import hooks from "ui/hooks";
import MaterialIcon from "./MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";
import { isPublicDisabled } from "ui/utils/org";

const WorkspacePrivacySummary = ({ workspace: { name } }: { workspace: Workspace }) => (
  <span>
    <span className="font-bold">{name}</span>
    {` can view`}
  </span>
);

export function getPrivacySummaryAndIcon(recording: Recording) {
  return { icon: "link", summary: "Active" };
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
  const isOwner = hooks.useIsOwner(recording.id || "00000000-0000-0000-0000-000000000000");

  const userBelongsToTeam = workspaceId && workspaces.find(w => w.id === workspaceId);

  const toggleIsPrivate = hooks.useToggleIsPrivate(recording.id, isPrivate);
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace(false);

  const options: ReactNode[] = [];

  const click = () => {
    console.log("click");
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

  options.push(
    <DropdownItem onClick={() => click(null)}>
      <DropdownItemContent icon="manage_search" selected={isPrivate && !workspaceId}>
        <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">Active</span>
      </DropdownItemContent>
    </DropdownItem>,
    <DropdownItem onClick={() => click(null)}>
      <DropdownItemContent icon="thumb_up_alt" selected={isPrivate && !workspaceId}>
        <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">Resolved</span>
      </DropdownItemContent>
    </DropdownItem>,
    <DropdownItem onClick={() => click(null)}>
      <DropdownItemContent icon="thumb_down_off_alt" selected={isPrivate && !workspaceId}>
        <span className="overflow-hidden overflow-ellipsis whitespace-pre text-xs">
          Couldn't resolve
        </span>
      </DropdownItemContent>
    </DropdownItem>
  );

  return options;
}

export default function StatusDropdown({ recording }: { recording: Recording }) {
  const workspaceId = recording.workspace?.id || null;
  const [expanded, setExpanded] = useState(false);
  const privacyOptions = useGetPrivacyOptions(recording, setExpanded);
  const { summary } = getPrivacySummaryAndIcon(recording);

  return (
    <div className="rounded-md px-2 py-1 bg-gray-200">
      <PortalDropdown
        buttonContent={<DropdownButton>{summary}</DropdownButton>}
        buttonStyle={"overflow-hidden"}
        setExpanded={setExpanded}
        expanded={expanded}
        distance={0}
        position="bottom-right"
      >
        <Dropdown menuItemsClassName="z-50 overflow-auto max-h-48" widthClass="w-48">
          {privacyOptions}
        </Dropdown>
      </PortalDropdown>
    </div>
  );
}
