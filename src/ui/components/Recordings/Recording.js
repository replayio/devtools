import React, { useState } from "react";
import Title from "../shared/Title";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import moment from "moment";

function formatDate(date) {
  return moment(date).format("MMM Do, h:mm a");
}

const DropdownPanel = ({ editingTitle, setEditingTitle, onDeleteRecording, recordingId }) => {
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
      recordingId={data.recording_id}
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
        recordingId={data.recording_id}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
      />
      <div className="secondary">{formatDate(data.date)}</div>
    </div>
  );
};
