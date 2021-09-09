import React, { useState } from "react";
import * as actions from "ui/actions/app";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { RecordingId } from "@recordreplay/protocol";
import { Recording } from "ui/types";
import { WorkspaceId } from "ui/state/app";
import { useGetWorkspaceId } from "ui/utils/routes";

function Privacy({
  isPrivate,
  toggleIsPrivate,
}: {
  isPrivate: boolean;
  toggleIsPrivate: () => void;
}) {
  if (isPrivate) {
    return (
      <div className="menu-item" onClick={toggleIsPrivate}>
        Make public
      </div>
    );
  }
  return (
    <div className="menu-item" onClick={toggleIsPrivate}>
      Make private
    </div>
  );
}

type DropdownPanelProps = PropsFromRedux & {
  recording: Recording;
};

const ItemDropdown = ({ recording, setModal }: DropdownPanelProps) => {
  const currentWorkspaceId = useGetWorkspaceId();
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

  return (
    <div className="dropdown-panel text-sm text-left">
      <div className="menu-item" onClick={() => onDeleteRecording(recordingId)}>
        Delete
      </div>
      <Privacy isPrivate={isPrivate} toggleIsPrivate={toggleIsPrivate} />
      <div className="menu-item" onClick={() => setModal("sharing", { recordingId })}>
        Share
      </div>
      <div className="border-b border-gray-200 w-full my-1" />
      {currentWorkspaceId ? (
        <div className="menu-item" onClick={() => updateRecording(null)}>
          Move to your personal library
        </div>
      ) : null}
      {!loading
        ? workspaces
            .filter(w => w.id !== currentWorkspaceId)
            .map(({ id, name }) => (
              <div className="menu-item" onClick={() => updateRecording(id)} key={id}>
                {`Move to ${name}`}
              </div>
            ))
        : null}
    </div>
  );
};

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ItemDropdown);
