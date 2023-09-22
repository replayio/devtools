import React from "react";

import { Recording, Workspace } from "shared/graphql/types";
import { useGetTeamIdFromRoute } from "ui/components/Library/Team/utils";
import { isTestSuiteReplay } from "ui/components/TestSuite/utils/isTestSuiteReplay";
import hooks from "ui/hooks";
import { WorkspaceId } from "ui/state/app";
import { subscriptionExpired } from "ui/utils/workspace";

import { DropdownDivider, DropdownItem } from "../../../../LibraryDropdown";

type RecordingOptionsDropdownProps = {
  onMoveRecording: (targetWorkspaceId: WorkspaceId | null) => void;
  workspaces: Workspace[];
  disableLibrary: boolean;
  isTestSuiteReplay: boolean;
};

export default function MoveRecordingMenu({
  onMoveRecording,
  workspaces,
  disableLibrary,
  isTestSuiteReplay = false,
}: RecordingOptionsDropdownProps) {
  const currentWorkspaceId = useGetTeamIdFromRoute();
  const { workspace, loading } = hooks.useGetWorkspace(currentWorkspaceId || "");

  const availableWorkspaces = workspaces.filter(
    w => w.id !== currentWorkspaceId && isTestSuiteReplay === !!w.isTest
  );

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
      <div className="max-h-48 overflow-y-auto">
        {!(currentWorkspaceId === null || disableLibrary) ? (
          <DropdownItem onClick={() => onMoveRecording(null)}>Your library</DropdownItem>
        ) : null}
        {availableWorkspaces.map(({ id, name }) => (
          <DropdownItem onClick={() => onMoveRecording(id)} key={id}>
            {name || ""}
          </DropdownItem>
        ))}
      </div>
    </>
  );
}
