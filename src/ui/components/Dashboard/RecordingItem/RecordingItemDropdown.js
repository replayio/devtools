import React from "react";
import { actions } from "ui/actions";
import { connect } from "react-redux";
import hooks from "ui/hooks";

function Privacy({ isPrivate, toggleIsPrivate }) {
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

const DropdownPanel = ({
  editingTitle,
  setEditingTitle,
  recording,
  toggleIsPrivate,
  isPrivate,
  setModal,
}) => {
  const deleteRecording = hooks.useDeleteRecording(["GetWorkspaceRecordings", "GetMyRecordings"]);

  const onDeleteRecording = recordingId => {
    const message =
      "This action will permanently delete this replay. \n\nAre you sure you want to proceed?";

    if (window.confirm(message)) {
      deleteRecording({ variables: { recordingId, deletedAt: new Date().toISOString() } });
    }
  };

  const recordingId = recording.id;

  return (
    <div className="dropdown-panel">
      {!editingTitle ? (
        <div className="menu-item" onClick={() => setEditingTitle(true)}>
          Edit Title
        </div>
      ) : null}
      <div className="menu-item" onClick={() => onDeleteRecording(recordingId)}>
        Delete Recording
      </div>
      <Privacy isPrivate={isPrivate} toggleIsPrivate={toggleIsPrivate} />
      <div className="menu-item" onClick={() => setModal("sharing", { recordingId })}>
        Open sharing preferences
      </div>
    </div>
  );
};

export default connect(null, {
  setModal: actions.setModal,
})(DropdownPanel);
