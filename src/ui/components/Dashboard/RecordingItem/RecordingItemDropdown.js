import React from "react";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
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
  currentWorkspaceId,
  editingTitle,
  setEditingTitle,
  recording,
  toggleIsPrivate,
  isPrivate,
  setModal,
}) => {
  const deleteRecording = hooks.useDeleteRecording();

  const onDeleteRecording = recordingId => {
    const message =
      "This action will permanently delete this replay. \n\nAre you sure you want to proceed?";

    if (window.confirm(message)) {
      deleteRecording(recordingId, currentWorkspaceId);
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

export default connect(state => ({ currentWorkspaceId: selectors.getWorkspaceId(state) }), {
  setModal: actions.setModal,
})(DropdownPanel);
