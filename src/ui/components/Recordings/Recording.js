import React, { useState } from "react";
import Title from "../shared/Title";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import moment from "moment";
import { gql, useMutation } from "@apollo/client";
import { features } from "ui/utils/prefs";

const UPDATE_IS_PRIVATE = gql`
  mutation MyMutation($recordingId: String, $isPrivate: Boolean) {
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
      {!features.private ? null : isPrivate ? (
        <div className="menu-item" onClick={toggleIsPrivate}>
          Make recording public
        </div>
      ) : (
        <div className="menu-item" onClick={toggleIsPrivate}>
          Make recording private
        </div>
      )}
    </div>
  );
};

export const Recording = ({ data, onDeleteRecording }) => {
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
    />
  );

  return (
    <div className="recording">
      <div className="screenshot">
        <img src={`data:image/png;base64, ${data.last_screen_data}`} alt="recording screenshot" />
        <Dropdown panel={Panel} icon={<div>•••</div>} panelStyles={{ top: "28px" }} />
        <div className="overlay" onClick={e => navigateToRecording(e)} />
        {/* <button icon={<LinkIconSvg />} onClick={() => navigateToRecording} /> */}
      </div>
      <div className="description">
        <Title
          defaultTitle={data.recordingTitle || data.title || "Untitled"}
          recordingId={data.recording_id}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
        />
        <div className="secondary">{formatDate(data.date)}</div>
        {features.private ? (
          <div className="permissions" onClick={toggleIsPrivate}>
            {data.is_private ? "Private" : "Public"}
          </div>
        ) : null}
      </div>
    </div>
  );
};
