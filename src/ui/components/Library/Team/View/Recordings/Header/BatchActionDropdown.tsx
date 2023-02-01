import { RecordingId } from "@replayio/protocol";
import classNames from "classnames";
import React, { useState } from "react";

import { Recording } from "shared/graphql/types";
import { useGetTeamIdFromRoute } from "ui/components/Library/Team/utils";
import hooks from "ui/hooks";
import { WorkspaceId } from "ui/state/app";
import { useIsPublicEnabled } from "ui/utils/org";

import { DisabledButton, getButtonClasses } from "../../../../../shared/Button";
import { useConfirm } from "../../../../../shared/Confirm";
import MaterialIcon from "../../../../../shared/MaterialIcon";
import PortalDropdown from "../../../../../shared/PortalDropdown";
import { Dropdown, DropdownItem } from "../../../../LibraryDropdown";
import MoveRecordingMenu from "../RecordingListItem/MoveRecordingMenu";

const getConfirmOptions = (
  count: number,
  firstTitle: string | null | undefined = "this replay"
) => {
  if (count === 1) {
    return {
      message: "Delete replay?",
      description: `This action will permanently delete ${firstTitle}.`,
      acceptLabel: "Delete replay",
    };
  }

  return {
    message: `Delete ${count} replays?`,
    description: `This action will permanently delete ${count} replays.`,
    acceptLabel: "Delete replays",
  };
};

type BatchActionDropdownProps = {
  selectedIds: RecordingId[];
  setSelectedIds: any;
  recordings: Recording[];
};

export default function BatchActionDropdown({
  selectedIds,
  setSelectedIds,
  recordings,
}: BatchActionDropdownProps) {
  const currentWorkspaceId = useGetTeamIdFromRoute();
  const { userId, loading: userIdLoading } = hooks.useGetUserId();
  const { workspaces, loading: workspacesLoading } = hooks.useGetNonPendingWorkspaces();
  const [expanded, setExpanded] = useState(false);
  const isPublicEnabled = useIsPublicEnabled();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();
  const updateIsPrivate = hooks.useUpdateIsPrivate();
  const deleteRecording = hooks.useDeleteRecordingFromLibrary();
  const { confirmDestructive } = useConfirm();

  if (workspacesLoading || userIdLoading) {
    return null;
  }

  const setSelectedIdsIsPrivate = (isPrivate: boolean) => {
    selectedIds.forEach(recordingId => {
      const recording = recordings.find(recording => recording.id === recordingId);
      if (recording) {
        updateIsPrivate(recording.id, isPrivate);
      }
    });
    setSelectedIds([]);
    setExpanded(false);
  };

  const deleteSelectedIds = () => {
    const firstSelectedRecordingTitle = recordings.find(
      recording => selectedIds[0] === recording.id
    )?.title;

    confirmDestructive(getConfirmOptions(selectedIds.length, firstSelectedRecordingTitle)).then(
      confirmed => {
        if (confirmed) {
          selectedIds.forEach(recordingId => deleteRecording(recordingId, currentWorkspaceId));
          setSelectedIds([]);
        }
        setExpanded(false);
      }
    );
  };

  const updateRecordings = (targetWorkspaceId: WorkspaceId | null) => {
    selectedIds.forEach(recordingId =>
      updateRecordingWorkspace(recordingId, currentWorkspaceId, targetWorkspaceId)
    );
    setSelectedIds([]);
    setExpanded(false);
  };

  if (!selectedIds.length) {
    return (
      <DisabledButton className="space-x-1 leading-4">
        <MaterialIcon outlined className="font-bold" iconSize="sm">
          expand_more
        </MaterialIcon>
        <span>{`${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""} selected`}</span>
      </DisabledButton>
    );
  }

  const buttonClasses = classNames("bg-white", getButtonClasses("blue", "secondary", "md"));
  const button = (
    <span className={"flex flex-row items-center space-x-1 leading-4 text-primaryAccent"}>
      <MaterialIcon outlined className="font-bold" iconSize="sm">
        expand_more
      </MaterialIcon>
      <span>{`${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""} selected`}</span>
    </span>
  );
  // Disable moving the selected recordings to the library if the user is not the author of
  // all the selected recordings.
  const enableLibrary = selectedIds
    .map(id => recordings.find(r => r.id === id))
    .every(recording => userId === recording?.user?.id);

  return (
    <PortalDropdown
      buttonContent={button}
      buttonStyle={buttonClasses}
      setExpanded={setExpanded}
      expanded={expanded}
      distance={0}
    >
      <Dropdown menuItemsClassName="z-50">
        {isPublicEnabled ? (
          <>
            <DropdownItem onClick={() => setSelectedIdsIsPrivate(true)}>Make private</DropdownItem>
            <DropdownItem onClick={() => setSelectedIdsIsPrivate(false)}>Make public</DropdownItem>
          </>
        ) : null}
        <DropdownItem onClick={deleteSelectedIds}>{`Delete ${selectedIds.length} item${
          selectedIds.length > 1 ? "s" : ""
        }`}</DropdownItem>
        <MoveRecordingMenu
          workspaces={workspaces}
          onMoveRecording={updateRecordings}
          disableLibrary={!enableLibrary}
        />
      </Dropdown>
    </PortalDropdown>
  );
}
