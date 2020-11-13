import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import Title from "../shared/Title";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import Avatar from "ui/components/Avatar";
import moment from "moment";
import { gql, useMutation } from "@apollo/client";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { useAuth0 } from "@auth0/auth0-react";

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

const DELETE_RECORDING = gql`
  mutation DeleteRecording($recordingId: String) {
    delete_recordings(where: { recording_id: { _eq: $recordingId } }) {
      returning {
        id
      }
    }
  }
`;

function formatDate(date) {
  // return moment(date).format("MMM Do, h:mm a");
  return moment(date).format("M/D/YYYY");
}

const DropdownPanel = ({
  editingTitle,
  setEditingTitle,
  recordingId,
  toggleIsPrivate,
  isPrivate,
  setSharingModal,
}) => {
  const [deleteRecording] = useMutation(DELETE_RECORDING, {
    refetchQueries: ["GetMyRecordings"],
  });

  const onDeleteRecording = async recordingId => {
    await deleteRecording({ variables: { recordingId } });
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
      <div className="menu-item" onClick={() => setSharingModal(recordingId)}>
        Open sharing preferences
      </div>
    </div>
  );
};

const Recording = ({
  data,
  setSharingModal,
  viewType,
  addSelectedId,
  removeSelectedId,
  selected,
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
    <DropdownPanel
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
        addSelectedId={addSelectedId}
        removeSelectedId={removeSelectedId}
        selected={selected}
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

function RecordingGridItem({
  data,
  Panel,
  onNavigate,
  editingTitle,
  setEditingTitle,
  toggleIsPrivate,
}) {
  return (
    <div className="recording-item">
      <div className="screenshot">
        <img src={`data:image/png;base64, ${data.last_screen_data}`} alt="recording screenshot" />
        <div className="overlay" onClick={e => onNavigate(e)} />
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
}

function RecordingListItem({
  data,
  Panel,
  onNavigate,
  editingTitle,
  setEditingTitle,
  toggleIsPrivate,
  addSelectedId,
  removeSelectedId,
  selected,
}) {
  const { user } = useAuth0();

  const toggleChecked = () => {
    if (selected) {
      removeSelectedId(data.recording_id);
    } else {
      addSelectedId(data.recording_id);
    }
  };

  const handleClick = () => {};
  console.log(selected);

  return (
    <li className={classnames("recording-item", { selected })} onClick={handleClick}>
      <input type="checkbox" onChange={toggleChecked} checked={selected} />
      <div className="screenshot">
        <img src={`data:image/png;base64, ${data.last_screen_data}`} alt="recording screenshot" />
      </div>
      <div className="item-title">
        <Title
          defaultTitle={data.recordingTitle || data.title || "Untitled"}
          recordingId={data.recording_id}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
        />
        {/* <div className="page-url">Created {moment().fromNow(data.date)}</div> */}
        <div className="page-url">Created {moment(data.date).fromNow()}</div>
      </div>
      <div className="page">
        <div className="page-title">{data.title || "No page title found"}</div>
        <div className="page-url">{data.url}</div>
      </div>
      <div>{getDurationString(data.duration)}</div>
      <div className="secondary">{formatDate(data.date)}</div>
      <div className="permissions" onClick={toggleIsPrivate}>
        {data.is_private ? "Private" : "Public"}
      </div>
      <div className="owner">
        <Avatar player={user} isFirstPlayer={true} />
      </div>
      <div className="more">
        {/* <button>
          <div className="img dots-horizontal" />
        </button> */}
        <Dropdown
          panel={Panel}
          icon={<div className="img dots-horizontal" />}
          panelStyles={{ top: "28px", right: "0px" }}
        />
      </div>
    </li>
  );
}

function getDurationString(durationMs) {
  const seconds = Math.round(durationMs / 1000);
  return `${seconds} sec`;
}

export default connect(
  state => ({
    modal: selectors.getModal(state),
  }),
  {
    setSharingModal: actions.setSharingModal,
  }
)(Recording);

function getDateString(date) {
  var month = date.getUTCMonth() + 1;
  var day = date.getUTCDate();
  var year = date.getUTCFullYear();

  return `${date} ${month} ${year}`;
}
