import React, { useState } from "react";
import hooks from "ui/hooks";
import RecordingListItem from "./RecordingListItem";
import RecordingItemDropdown from "./RecordingItemDropdown";

export default function RecordingItem({
  data,
  selected,
  addSelectedId,
  removeSelectedId,
  editing,
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [isPrivate, setIsPrivate] = useState(data.private);
  const updateIsPrivate = hooks.useUpdateIsPrivate();

  const toggleIsPrivate = () => {
    setIsPrivate(!isPrivate);
    updateIsPrivate({ variables: { recordingId: data.id, isPrivate: !isPrivate } });
  };
  const onNavigate = event => {
    let url = `/view?id=${data.id}`;
    const isTesting = new URL(window.location.href).searchParams.get("e2etest");

    if (isTesting) {
      url += `&e2etest=true`;
    }

    if (event.metaKey) {
      return window.open(url);
    }
    window.location = url;
  };

  const Panel = (
    <RecordingItemDropdown
      editingTitle={editingTitle}
      setEditingTitle={setEditingTitle}
      recording={data}
      toggleIsPrivate={toggleIsPrivate}
      isPrivate={isPrivate}
    />
  );

  return (
    <RecordingListItem
      data={data}
      Panel={Panel}
      onNavigate={onNavigate}
      editingTitle={editingTitle}
      setEditingTitle={setEditingTitle}
      toggleIsPrivate={toggleIsPrivate}
      selected={selected}
      addSelectedId={addSelectedId}
      removeSelectedId={removeSelectedId}
      editing={editing}
    />
  );
}
