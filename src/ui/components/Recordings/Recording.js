import React, { useState } from "react";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import moment from "moment";
import { gql, useMutation } from "@apollo/client";

function formatDate(date) {
  return moment(date).format("MMM Do, h:mm a");
}

const UPDATE_RECORDING = gql`
  mutation MyMutation($id: uuid, $title: String) {
    update_recordings(_set: { recordingTitle: $title }, where: { id: { _eq: $id } }) {
      returning {
        id
        recordingTitle
      }
    }
  }
`;

const Title = ({ defaultTitle, id, setEditingTitle, editingTitle }) => {
  const [updateRecordingTitle] = useMutation(UPDATE_RECORDING);
  const [title, setTitle] = useState(defaultTitle);

  const saveTitle = () => {
    updateRecordingTitle({ variables: { id, title } });
    setEditingTitle(false);
  };
  const handleKeyDown = event => {
    if (event.key == "Enter") {
      saveTitle();
    } else if (event.key == "Escape") {
      setEditingTitle(false);
    }
  };

  if (editingTitle) {
    return (
      <input
        type="text"
        className="title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={saveTitle}
        autoFocus
      />
    );
  }

  return (
    <div className="title" onClick={() => setEditingTitle(true)}>
      {title}
    </div>
  );
};

const DropdownPanel = ({ editingTitle, setEditingTitle, onDeleteRecording, id }) => {
  return (
    <div className="dropdown-panel">
      {!editingTitle ? (
        <div className="menu-item" onClick={() => setEditingTitle(true)}>
          Edit Title
        </div>
      ) : null}
      <div className="menu-item" onClick={() => onDeleteRecording(id)}>
        Delete Recording
      </div>
    </div>
  );
};

export const Recording = ({ data, onDeleteRecording }) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const Panel = (
    <DropdownPanel
      editingTitle={editingTitle}
      setEditingTitle={setEditingTitle}
      id={data.id}
      onDeleteRecording={onDeleteRecording}
    />
  );

  const navigateToRecording = event => {
    if (event.metaKey) {
      return window.open(`/view?id=${data.recording_id}`);
    }
    window.location = `/view?id=${data.recording_id}`;
  };

  return (
    <div className="recording">
      <div className="screenshot">
        <img src={`data:image/png;base64, ${data.last_screen_data}`} alt="recording screenshot" />
        <Dropdown panel={Panel} icon={<div>•••</div>} panelStyles={{ top: "28px" }} />
        <div className="overlay" onClick={e => navigateToRecording(e)} />
        {/* <button icon={<LinkIconSvg />} onClick={() => navigateToRecording} /> */}
      </div>
      <Title
        defaultTitle={data.recordingTitle || data.title || "Untitled"}
        id={data.id}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
      />
      <div className="secondary">{formatDate(data.date)}</div>
    </div>
  );
};
