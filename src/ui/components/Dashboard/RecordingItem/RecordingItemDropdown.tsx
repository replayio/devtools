import React, { Dispatch, SetStateAction } from "react";
import * as actions from "ui/actions/app";
import * as selectors from "ui/reducers/app";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { RecordingId } from "@recordreplay/protocol";
import { Recording } from "ui/types";
import { WorkspaceId } from "ui/state/app";
import { UIState } from "ui/state";

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
  editingTitle: boolean;
  isPrivate: boolean;
  recording: Recording;
  setEditingTitle: Dispatch<SetStateAction<boolean>>;
  toggleIsPrivate: () => void;
};

const DropdownPanel = ({
  currentWorkspaceId,
  editingTitle,
  setEditingTitle,
  recording,
  toggleIsPrivate,
  isPrivate,
  setModal,
}: DropdownPanelProps) => {
  const deleteRecording = hooks.useDeleteRecordingFromLibrary();
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();
  const recordingId = recording.id;

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
    <div className="dropdown-panel">
      {!editingTitle ? (
        <div className="menu-item" onClick={() => setEditingTitle(true)}>
          Edit title
        </div>
      ) : null}
      <div className="menu-item" onClick={() => onDeleteRecording(recordingId)}>
        Delete
      </div>
      <Privacy isPrivate={isPrivate} toggleIsPrivate={toggleIsPrivate} />
      <div className="menu-item" onClick={() => setModal("sharing", { recordingId })}>
        Share
      </div>
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

const connector = connect(
  (state: UIState) => ({ currentWorkspaceId: selectors.getWorkspaceId(state) }),
  {
    setModal: actions.setModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DropdownPanel);
