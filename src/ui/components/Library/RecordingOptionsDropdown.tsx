import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { Recording } from "ui/types";
import MaterialIcon from "../shared/MaterialIcon";
import hooks from "ui/hooks";
import { RecordingId } from "@recordreplay/protocol";
import { WorkspaceId } from "ui/state/app";
import { Dropdown, DropdownDivider, DropdownItem } from "./LibraryDropdown";
import PortalDropdown from "../shared/PortalDropdown";
import classNames from "classnames";
import MoveRecordingMenu from "./MoveRecordingMenu";
import { useConfirm } from "../shared/Confirm";
import { isPublicDisabled } from "ui/utils/org";
import { useGetNonPendingWorkspaces } from "ui/hooks/workspaces";

type RecordingOptionsDropdownProps = PropsFromRedux & {
  recording: Recording;
};

function useGetPermissions(recording: Recording) {
  const { userId, loading } = hooks.useGetUserId();
  const { workspaces } = useGetNonPendingWorkspaces();

  if (loading) {
    return { showDropdown: false, loading };
  }

  const isOwner = userId == recording.user?.id;
  // Node recordings don't have an owner since they're uploaded using the workspace's
  // API key. We add this check here so the team is able to access the dropdown.
  const sameTeam =
    recording.workspace?.id && workspaces.find(w => w.id === recording.workspace?.id);
  const showDropdown = isOwner || (!recording.user && sameTeam);

  return { showDropdown, loading };
}

function RecordingOptionsDropdown({
  currentWorkspaceId,
  recording,
  setModal,
}: RecordingOptionsDropdownProps) {
  const [isPrivate, setIsPrivate] = useState(recording.private);
  const [expanded, setExpanded] = useState(false);
  const { showDropdown, loading: loadingOwnershipInfo } = useGetPermissions(recording);
  const deleteRecording = hooks.useDeleteRecordingFromLibrary();
  const { workspaces, loading: loadingWorkspaces } = hooks.useGetNonPendingWorkspaces();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();
  const updateRecordingTitle = hooks.useUpdateRecordingTitle();
  const updateIsPrivate = hooks.useUpdateIsPrivate();
  const recordingId = recording.id;
  const { confirmDestructive } = useConfirm();

  const toggleIsPrivate = () => {
    setIsPrivate(!isPrivate);
    updateIsPrivate(recording.id, !isPrivate);
    setExpanded(false);
  };
  const onDeleteRecording = (recordingId: RecordingId) => {
    setExpanded(false);
    
    confirmDestructive({
      message: "Delete replay?",
      description:
        "This action will permanently delete this replay. \n\nAre you sure you want to proceed?",
      acceptLabel: "Delete replay",
    }).then(confirmed => {
      if (confirmed) {
        deleteRecording(recordingId, currentWorkspaceId);
      }
    });
  };
  const onRename = () => {
    setModal("rename-replay", { recordingId: recording.id, title: recording.title || "" });
    setExpanded(false);
  };
  const updateRecording = (targetWorkspaceId: WorkspaceId | null) => {
    updateRecordingWorkspace(recordingId, currentWorkspaceId, targetWorkspaceId);
    setExpanded(false);
  };
  const handleShareClick = () => {
    setModal("sharing", { recordingId });
    setExpanded(false);
  };

  if (loadingOwnershipInfo || !showDropdown) {
    return null;
  }

  const button = (
    <MaterialIcon
      outlined
      className={classNames(
        expanded ? "opacity-100" : "",
        "h-4 w-4 text-gray-400 opacity-0 hover:text-primaryAccentHover group-hover:opacity-100"
      )}
    >
      more_vert
    </MaterialIcon>
  );

  return (
    <PortalDropdown
      buttonContent={button}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle=""
      distance={0}
    >
      <Dropdown>
        {isPublicDisabled(workspaces, currentWorkspaceId) ? null : (
          <DropdownItem onClick={() => onRename()}>Rename</DropdownItem>
        )}
        <DropdownItem onClick={() => onDeleteRecording(recordingId)}>Delete</DropdownItem>
        {isPublicDisabled(workspaces, currentWorkspaceId) ? null : (
          <DropdownItem onClick={toggleIsPrivate}>{`Make ${
            isPrivate ? "public" : "private"
          }`}</DropdownItem>
        )}
        <DropdownItem onClick={handleShareClick}>Share</DropdownItem>
        {!loadingWorkspaces ? (
          <MoveRecordingMenu workspaces={workspaces} onMoveRecording={updateRecording} />
        ) : null}
      </Dropdown>
    </PortalDropdown>
  );
}

const connector = connect(
  (state: UIState) => ({ currentWorkspaceId: selectors.getWorkspaceId(state) }),
  {
    setModal: actions.setModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(RecordingOptionsDropdown);
