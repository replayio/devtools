import { RecordingId } from "@replayio/protocol";
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Recording } from "ui/types";
import MaterialIcon from "../shared/MaterialIcon";
import hooks from "ui/hooks";
import { WorkspaceId } from "ui/state/app";
import { Dropdown, DropdownItem } from "./LibraryDropdown";
import PortalDropdown from "../shared/PortalDropdown";
import classNames from "classnames";
import MoveRecordingMenu from "./MoveRecordingMenu";
import { useConfirm } from "../shared/Confirm";
import { useIsPublicEnabled } from "ui/utils/org";
import { getWorkspaceId } from "ui/reducers/app";
import { setModal } from "ui/actions/app";
import { useGetUserPermissions } from "ui/hooks/users";

function DeleteOption({
  onOptionClick,
  recording,
}: {
  onOptionClick: () => void;
  recording: Recording;
}) {
  const currentWorkspaceId = useAppSelector(getWorkspaceId);
  const { confirmDestructive } = useConfirm();
  const deleteRecording = hooks.useDeleteRecordingFromLibrary();

  const onDeleteRecording = (recordingId: RecordingId) => {
    onOptionClick();

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

  return <DropdownItem onClick={() => onDeleteRecording(recording.id)}>Delete</DropdownItem>;
}
function RenameOption({
  onOptionClick,
  recording,
}: {
  onOptionClick: () => void;
  recording: Recording;
}) {
  const dispatch = useAppDispatch();
  const isPublicEnabled = useIsPublicEnabled();

  if (!isPublicEnabled) {
    return null;
  }

  const onRename = () => {
    const modalOptions = { recordingId: recording.id, title: recording.title || "" };
    dispatch(setModal("rename-replay", modalOptions));
    onOptionClick();
  };

  return <DropdownItem onClick={() => onRename()}>Rename</DropdownItem>;
}
function TogglePrivacyOption({
  onOptionClick,
  recording,
}: {
  onOptionClick: () => void;
  recording: Recording;
}) {
  const [isPrivate, setIsPrivate] = useState(recording.private);
  const isPublicEnabled = useIsPublicEnabled();
  const updateIsPrivate = hooks.useUpdateIsPrivate();

  const toggleIsPrivate = () => {
    setIsPrivate(!isPrivate);
    updateIsPrivate(recording.id, !isPrivate);
    onOptionClick();
  };

  if (!isPublicEnabled) {
    return null;
  }

  return (
    <DropdownItem onClick={toggleIsPrivate}>{`Make ${
      isPrivate ? "public" : "private"
    }`}</DropdownItem>
  );
}
function ShareOption({
  onOptionClick,
  recording,
}: {
  onOptionClick: () => void;
  recording: Recording;
}) {
  const dispatch = useAppDispatch();
  const handleShareClick = () => {
    dispatch(setModal("sharing", { recordingId: recording.id }));
    onOptionClick();
  };

  return <DropdownItem onClick={handleShareClick}>Share</DropdownItem>;
}
function MoveRecordingOption({
  onOptionClick,
  recording,
}: {
  onOptionClick: () => void;
  recording: Recording;
}) {
  const { permissions } = useGetUserPermissions(recording);
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();
  const currentWorkspaceId = useAppSelector(getWorkspaceId);

  const updateRecording = (targetWorkspaceId: WorkspaceId | null) => {
    updateRecordingWorkspace(recording.id, currentWorkspaceId, targetWorkspaceId);
    onOptionClick();
  };

  if (loading) {
    return null;
  }

  return (
    <MoveRecordingMenu
      workspaces={workspaces}
      onMoveRecording={updateRecording}
      disableLibrary={!permissions.moveToLibrary}
    />
  );
}

export default function RecordingOptionsDropdown({ recording }: { recording: Recording }) {
  const [expanded, setExpanded] = useState(false);
  const { loading, permissions } = useGetUserPermissions(recording);

  if (loading) {
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
  const onOptionClick = () => setExpanded(false);

  return (
    <PortalDropdown
      buttonContent={button}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle=""
      distance={0}
    >
      <Dropdown>
        {permissions.rename && <RenameOption onOptionClick={onOptionClick} recording={recording} />}
        {permissions.delete && <DeleteOption onOptionClick={onOptionClick} recording={recording} />}
        {permissions.privacy && (
          <TogglePrivacyOption onOptionClick={onOptionClick} recording={recording} />
        )}
        <ShareOption onOptionClick={onOptionClick} recording={recording} />
        {permissions.move && (
          <MoveRecordingOption onOptionClick={onOptionClick} recording={recording} />
        )}
      </Dropdown>
    </PortalDropdown>
  );
}
