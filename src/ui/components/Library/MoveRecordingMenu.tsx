import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { Workspace } from "ui/types";
import { WorkspaceId } from "ui/state/app";
import { DropdownDivider, DropdownItem } from "./LibraryDropdown";
import hooks from "ui/hooks";
import { subscriptionExpired } from "ui/utils/workspace";

type RecordingOptionsDropdownProps = PropsFromRedux & {
  onMoveRecording: (targetWorkspaceId: WorkspaceId | null) => void;
  workspaces: Workspace[];
};

function MoveRecordingMenu({
  currentWorkspaceId,
  onMoveRecording,
  workspaces,
}: RecordingOptionsDropdownProps) {
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
      <div className="max-h-48 overflow-y-auto">
        {currentWorkspaceId !== null ? (
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

const connector = connect((state: UIState) => ({
  currentWorkspaceId: selectors.getWorkspaceId(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(MoveRecordingMenu);
