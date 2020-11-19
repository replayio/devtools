import React, { useState } from "react";
import { connect } from "react-redux";
import { gql, useMutation } from "@apollo/client";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
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

const RecordingItem = ({
  data,
  setSharingModal,
  viewType,
  selectedIds,
  setSelectedIds,
  editing,
}) => {
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
      setSharingModal={setSharingModal}
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
};

export default connect(
  state => ({
    modal: selectors.getModal(state),
  }),
  {
    setSharingModal: actions.setSharingModal,
  }
)(RecordingItem);
