import React from "react";
import { Workspace } from "ui/types";
import { WorkspaceId } from "ui/state/app";
import { DropdownDivider, DropdownItem } from "../../../../LibraryDropdown";
import hooks from "ui/hooks";
import { subscriptionExpired } from "ui/utils/workspace";
import { useGetTeamIdFromRoute } from "ui/components/Library/Team/utils";

type RecordingOptionsDropdownProps = {
  onMoveRecording: (targetWorkspaceId: WorkspaceId | null) => void;
  workspaces: Workspace[];
  disableLibrary: boolean;
};

export default function MoveRecordingMenu({
  onMoveRecording,
  workspaces,
  disableLibrary,
}: RecordingOptionsDropdownProps) {
  const currentWorkspaceId = useGetTeamIdFromRoute();
  const { workspace, loading } = hooks.useGetWorkspace(currentWorkspaceId || "");

  const availableWorkspaces = workspaces.filter(w => w.id !== currentWorkspaceId);

  if (
    availableWorkspaces.length === 0 ||
    loading ||
    (workspace && (!workspace?.subscription || subscriptionExpired(workspace)))
  ) {
    return null;
  }

  return (
    <>
      <div className="px-4 py-2 text-xs font-bold uppercase">Move to:</div>
      <DropdownDivider />
      <div className="overflow-y-auto max-h-48">
        {!(currentWorkspaceId === null || disableLibrary) ? (
          <DropdownItem onClick={() => onMoveRecording(null)}>Your library</DropdownItem>
        ) : null}
        {availableWorkspaces.map(({ id, name }) => (
          <DropdownItem onClick={() => onMoveRecording(id)} key={id}>
            {name}
          </DropdownItem>
        ))}
      </div>
    </>
  );
}
