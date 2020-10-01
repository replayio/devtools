import React, { useState, useEffect } from "react";
import { gql, useMutation } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";

const UPDATE_RECORDING = gql`
  mutation MyMutation($recordingId: String, $title: String) {
    update_recordings(
      _set: { recordingTitle: $title }
      where: { recording_id: { _eq: $recordingId } }
    ) {
      returning {
        id
        recordingTitle
      }
    }
  }
`;

export default function Title({ defaultTitle, recordingId, setEditingTitle, editingTitle }) {
  const { isAuthenticated } = useAuth0();
  const [updateRecordingTitle] = useMutation(UPDATE_RECORDING);
  const [title, setTitle] = useState(defaultTitle);

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  const saveTitle = () => {
    updateRecordingTitle({ variables: { recordingId, title } });
    setEditingTitle(false);
  };
  const handleKeyDown = event => {
    if (event.key == "Enter") {
      saveTitle();
    } else if (event.key == "Escape") {
      setEditingTitle(false);
    }
  };
  const handleClick = () => {
    if (!isAuthenticated) {
      return;
    }
    setEditingTitle(true);
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
    <div className="title" onClick={handleClick}>
      {title}
    </div>
  );
}
