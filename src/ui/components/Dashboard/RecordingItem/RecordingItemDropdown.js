import React from "react";
import { actions } from "ui/actions";
import { connect } from "react-redux";
import { gql, useMutation } from "@apollo/client";
import moment from "moment";

const INVALIDATE_RECORDING = gql`
  mutation InvalidateRecording($recordingId: uuid!, $deletedTime: timestamptz) {
    update_recordings(
      where: { id: { _eq: $recordingId } }
      _set: { invalid: true, deleted_at: $deletedTime }
    ) {
      returning {
        id
      }
    }
  }
`;

const DropdownPanel = ({
  editingTitle,
  setEditingTitle,
  recordingId,
  toggleIsPrivate,
  isPrivate,
  setModal,
}) => {
  const [deleteRecording] = useMutation(INVALIDATE_RECORDING, {
    refetchQueries: ["GetMyRecordings"],
  });

  const onDeleteRecording = async recordingId => {
    await deleteRecording({ variables: { recordingId, deletedTime: moment().format() } });
  };

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
      {isPrivate ? (
        <div className="menu-item" onClick={toggleIsPrivate}>
          Make public
        </div>
      ) : (
        <div className="menu-item" onClick={toggleIsPrivate}>
          Make private
        </div>
      )}
      <div className="menu-item" onClick={() => setModal("sharing")}>
        Open sharing preferences
      </div>
    </div>
  );
};

export default connect(null, {
  setModal: actions.setModal,
})(DropdownPanel);
