import React, { useState } from "react";
import { connect } from "react-redux";
import Title from "../shared/Title";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import moment from "moment";
import { gql, useMutation } from "@apollo/client";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";

const UPDATE_IS_PRIVATE = gql`
  mutation SetRecordingIsPrivate($recordingId: String, $isPrivate: Boolean) {
    update_recordings(
      where: { recording_id: { _eq: $recordingId } }
      _set: { is_private: $isPrivate }
    ) {
      returning {
        is_private
        id
      }
    }
  }
`;

function formatDate(date) {
  return moment(date).format("MMM Do, h:mm a");
}

const DropdownPanel = ({
  editingTitle,
  setEditingTitle,
  onDeleteRecording,
  recordingId,
  toggleIsPrivate,
  isPrivate,
  setSharingModal,
}) => {
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
      <div className="menu-item" onClick={() => setSharingModal(recordingId)}>
        Open sharing preferences
      </div>
    </div>
  );
};

const Recording = ({ data, onDeleteRecording, setSharingModal }) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [isPrivate, setIsPrivate] = useState(data.is_private);
  const [updateIsPrivate] = useMutation(UPDATE_IS_PRIVATE);

  const navigateToRecording = event => {
    if (event.metaKey) {
      return window.open(`/view?id=${data.recording_id}`);
    }
    window.location = `/view?id=${data.recording_id}`;
  };
  const toggleIsPrivate = () => {
    setIsPrivate(!isPrivate);
    updateIsPrivate({ variables: { recordingId: data.recording_id, isPrivate: !isPrivate } });
  };

  const Panel = (
    <DropdownPanel
      editingTitle={editingTitle}
      setEditingTitle={setEditingTitle}
      recordingId={data.recording_id}
      onDeleteRecording={onDeleteRecording}
      toggleIsPrivate={toggleIsPrivate}
      isPrivate={isPrivate}
      setSharingModal={setSharingModal}
    />
  );

  return (
    <div className="recording">
      <div className="screenshot">
        <img src={`data:image/png;base64, ${data.last_screen_data}`} alt="recording screenshot" />
        <div className="overlay" onClick={e => navigateToRecording(e)} />
        {/* <button icon={<LinkIconSvg />} onClick={() => navigateToRecording} /> */}
        <Dropdown panel={Panel} icon={<div>•••</div>} panelStyles={{ top: "28px" }} />
      </div>
      <div className="description">
        <Title
          defaultTitle={data.recordingTitle || data.title || "Untitled"}
          recordingId={data.recording_id}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
        />
        <div className="secondary">{formatDate(data.date)}</div>
        <div className="permissions" onClick={toggleIsPrivate}>
          {data.is_private ? "Private" : "Public"}
        </div>
      </div>
    </div>
  );
};

export default connect(
  state => ({
    modal: selectors.getModal(state),
  }),
  {
    setSharingModal: actions.setSharingModal,
  }
)(Recording);
