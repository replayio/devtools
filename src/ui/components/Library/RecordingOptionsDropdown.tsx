import { RecordingId } from "@replayio/protocol";
import classNames from "classnames";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setModal } from "ui/actions/app";
import hooks from "ui/hooks";
import { useGetUserPermissions } from "ui/hooks/users";
import { getWorkspaceId } from "ui/reducers/app";
import { WorkspaceId } from "ui/state/app";
import { Recording } from "ui/types";
import { useIsPublicEnabled } from "ui/utils/org";

import { useConfirm } from "../shared/Confirm";
import MaterialIcon from "../shared/MaterialIcon";

import { Dropdown, DropdownItem } from "./LibraryDropdown";
import MoveRecordingMenu from "./MoveRecordingMenu";



function DeleteOption({
  recording,
}: {
  recording: Recording;
}) {
  const currentWorkspaceId = useSelector(getWorkspaceId);
  const { confirmDestructive } = useConfirm();
  const deleteRecording = hooks.useDeleteRecordingFromLibrary();

  const onDeleteRecording = (recordingId: RecordingId) => {

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
  recording,
}: {
  recording: Recording;
}) {
  const dispatch = useDispatch();
  const isPublicEnabled = useIsPublicEnabled();

  if (!isPublicEnabled) {
    return null;
  }

  const onRename = () => {
    const modalOptions = { recordingId: recording.id, title: recording.title || "" };
    dispatch(setModal("rename-replay", modalOptions));
  };

  return <DropdownItem onClick={() => onRename()}>Rename</DropdownItem>;
}
function TogglePrivacyOption({
  recording,
}: {
  recording: Recording;
}) {
  const [isPrivate, setIsPrivate] = useState(recording.private);
  const isPublicEnabled = useIsPublicEnabled();
  const updateIsPrivate = hooks.useUpdateIsPrivate();

  const toggleIsPrivate = () => {
    setIsPrivate(!isPrivate);
    updateIsPrivate(recording.id, !isPrivate);
  };

  if (!isPublicEnabled) {
    return null;
  }

  return (
    <DropdownItem onClick={toggleIsPrivate}>{`Make ${isPrivate ? "public" : "private"
      }`}</DropdownItem>
  );
}
function ShareOption({
  recording,
}: {
  recording: Recording;
}) {
  const dispatch = useDispatch();
  const handleShareClick = () => {
    dispatch(setModal("sharing", { recordingId: recording.id }));
  };

  return <DropdownItem onClick={handleShareClick}>Share</DropdownItem>;
}
function MoveRecordingOption({
  recording,
}: {
  recording: Recording;
}) {
  const { permissions } = useGetUserPermissions(recording);
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();
  const currentWorkspaceId = useSelector(getWorkspaceId);

  const updateRecording = (targetWorkspaceId: WorkspaceId | null) => {
    updateRecordingWorkspace(recording.id, currentWorkspaceId, targetWorkspaceId);
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
  const { loading, permissions } = useGetUserPermissions(recording);

  if (loading) {
    return null;
  }

  return (
    <Dropdown trigger={({open}) => (
      <MaterialIcon
        outlined
        className={classNames(
          open ? "opacity-100" : "",
          "h-4 w-4 text-gray-400 opacity-0 hover:text-primaryAccentHover group-hover:opacity-100"
        )}
      >
        more_vert
      </MaterialIcon>
    )}>
      {permissions.rename && <RenameOption recording={recording} />}
      {permissions.delete && <DeleteOption recording={recording} />}
      {permissions.privacy && (<TogglePrivacyOption recording={recording} />)}
      <ShareOption recording={recording} />
      {permissions.move && (<MoveRecordingOption recording={recording} />)}
    </Dropdown>
  );
}
