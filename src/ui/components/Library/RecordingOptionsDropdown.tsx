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
import { Dropdown, DropdownButton, DropdownDivider, DropdownItem } from "./LibraryDropdown";

type RecordingOptionsDropdownProps = PropsFromRedux & {
  recording: Recording;
};

function RecordingOptionsDropdown({
  currentWorkspaceId,
  recording,
  setModal,
}: RecordingOptionsDropdownProps) {
  const [isPrivate, setIsPrivate] = useState(recording.private);
  const deleteRecording = hooks.useDeleteRecordingFromLibrary();
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();
  const updateIsPrivate = hooks.useUpdateIsPrivate();
  const recordingId = recording.id;

  const toggleIsPrivate = () => {
    setIsPrivate(!isPrivate);
    updateIsPrivate({ variables: { recordingId: recording.id, isPrivate: !isPrivate } });
  };

  const onDeleteRecording = (recordingId: RecordingId) => {
    const message =
      "This action will permanently delete this replay. \n\nAre you sure you want to proceed?";

    if (window.confirm(message)) {
      deleteRecording(recordingId, currentWorkspaceId);
    }
  };
  const updateRecording = (targetWorkspaceId: WorkspaceId | null) => {
    updateRecordingWorkspace(recordingId, currentWorkspaceId, targetWorkspaceId);
  };

  const button = (
    <DropdownButton className="opacity-0 group-hover:opacity-100">
      <MaterialIcon
        outlined
        className="h-4 w-4 text-gray-400 hover:text-primaryAccentHover text-base leading-4"
      >
        more_vert
      </MaterialIcon>
    </DropdownButton>
  );

  return (
    <Dropdown button={button} menuItemsClassName={"mr-8"}>
      <DropdownItem onClick={() => onDeleteRecording(recordingId)}>Delete</DropdownItem>
      <DropdownItem onClick={toggleIsPrivate}>{`Make ${
        isPrivate ? "public" : "private"
      }`}</DropdownItem>
      <DropdownItem onClick={() => setModal("sharing", { recordingId })}>Share</DropdownItem>
      <DropdownDivider />
      <div className="overflow-y-auto max-h-48">
        {currentWorkspaceId !== null ? (
          <DropdownItem onClick={() => updateRecording(null)}>
            Move to your personal library
          </DropdownItem>
        ) : null}
        {!loading
          ? workspaces
              .filter(w => w.id !== currentWorkspaceId)
              .map(({ id, name }) => (
                <DropdownItem onClick={() => updateRecording(id)} key={id}>
                  {`Move to ${name}`}
                </DropdownItem>
              ))
          : null}
      </div>
    </Dropdown>
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
