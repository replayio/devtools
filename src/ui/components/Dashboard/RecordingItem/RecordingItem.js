import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import RecordingGridItem from "./RecordingGridItem";
import RecordingListItem from "./RecordingListItem";
import RecordingItemDropdown from "./RecordingItemDropdown";

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

export default function RecordingItem({ data, viewType, selectedIds, setSelectedIds, editing }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [isPrivate, setIsPrivate] = useState(data.is_private);
  const [updateIsPrivate] = useMutation(UPDATE_IS_PRIVATE);

  const toggleIsPrivate = () => {
    setIsPrivate(!isPrivate);
    updateIsPrivate({ variables: { recordingId: data.recording_id, isPrivate: !isPrivate } });
  };
  const onNavigate = event => {
    if (event.metaKey) {
      return window.open(`/view?id=${data.recording_id}`);
    }
    window.location = `/view?id=${data.recording_id}`;
  };

  const Panel = (
    <RecordingItemDropdown
      editingTitle={editingTitle}
      setEditingTitle={setEditingTitle}
      recordingId={data.recording_id}
      toggleIsPrivate={toggleIsPrivate}
      isPrivate={isPrivate}
    />
  );

  if (viewType == "list") {
    return (
      <RecordingListItem
        data={data}
        Panel={Panel}
        onNavigate={onNavigate}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        toggleIsPrivate={toggleIsPrivate}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
      />
    );
  }

  return (
    <RecordingGridItem
      data={data}
      Panel={Panel}
      onNavigate={onNavigate}
      editingTitle={editingTitle}
      setEditingTitle={setEditingTitle}
      toggleIsPrivate={toggleIsPrivate}
    />
  );
}
