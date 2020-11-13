import React, { useState, useEffect } from "react";
import classnames from "classnames";
import { connect } from "react-redux";
import { selectors } from "../../reducers";
import Recording from "./Recording";
import { useAuth0 } from "@auth0/auth0-react";
import { sortBy } from "lodash";
import { gql, useQuery, useMutation } from "@apollo/client";
import DashboardNavigation from "./DashboardNavigation";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";

import moment from "moment";

import "./Recordings.css";

const GET_MY_RECORDINGS = gql`
  query GetMyRecordings($authId: String) {
    recordings(where: { user: { auth_id: { _eq: $authId } } }) {
      id
      url
      title
      recording_id
      recordingTitle
      last_screen_mime_type
      duration
      description
      date
      last_screen_data
      is_private
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

const Dashboard = props => {
  const { user } = useAuth0();
  const [filter, setFilter] = useState("");
  const { data } = useQuery(GET_MY_RECORDINGS, {
    variables: { authId: user.sub },
  });

  const visibleRecordings = [...data.recordings].filter(recording =>
    recording.url.includes(filter)
  );
  const sortedRecordings = sortBy(visibleRecordings, recording => -new Date(recording.date));

  return (
    <main className="dashboard">
      <DashboardNavigation recordings={data.recordings} setFilter={setFilter} filter={filter} />
      <DashboardViewer recordings={sortedRecordings} filter={filter} />
    </main>
  );
};

function DashboardViewer({ recordings, filter }) {
  const [viewType, setViewType] = useState("list");
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const addSelectedId = item => {
    setSelectedIds([...selectedIds, item]);
  };
  const removeSelectedId = item => {
    setSelectedIds(selectedIds.filter(id => id !== item));
  };
  const toggleEditing = () => {
    if (editing) {
      setSelectedIds([]);
    }
    setEditing(!editing);
  };

  return (
    <div className={classnames("dashboard-viewer", { editing })}>
      <DashboardViewerHeader
        filter={filter}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        toggleEditing={toggleEditing}
        viewType={viewType}
        setViewType={setViewType}
      />
      <DashboardViewerContent
        recordings={recordings}
        viewType={viewType}
        addSelectedId={addSelectedId}
        removeSelectedId={removeSelectedId}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
      />
    </div>
  );
}

function DashboardViewerHeader({
  filter,
  selectedIds,
  setSelectedIds,
  editing,
  toggleEditing,
  viewType,
  setViewType,
}) {
  const [deleteRecording] = useMutation(DELETE_RECORDING, {
    refetchQueries: ["GetMyRecordings"],
  });

  const deleteSelectedIds = () => {
    selectedIds.forEach(recordingId => deleteRecording({ variables: { recordingId } }));
    setSelectedIds([]);
  };

  const panel = (
    <div className="dropdown-panel">
      {/* <div className="menu-item" onClick={() => setEditingTitle(true)}> */}
      <div className="menu-item" onClick={deleteSelectedIds}>
        {`Delete ${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""}`}
      </div>
    </div>
  );
  const icon = (
    <div className={classnames("batch-action", { disabled: !selectedIds.length })}>
      <div className="img chevron-down" />
      {`${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""} selected`}
    </div>
  );

  return (
    <header className="dashboard-viewer-header">
      <div className="dashboard-viewer-header-title">{filter == "" ? "All" : filter}</div>
      <div className="dashboard-viewer-header-actions">
        {editing ? <Dropdown panel={panel} icon={icon} /> : null}
        {editing ? (
          <button className="toggle-editing" onClick={toggleEditing}>
            Done
          </button>
        ) : (
          <button className="toggle-editing" onClick={toggleEditing}>
            Edit
          </button>
        )}
        <div className="dashboard-viewer-header-views">
          <button
            className={classnames({ selected: viewType == "grid" })}
            disabled={viewType == "grid"}
            onClick={() => setViewType("grid")}
          >
            <div className="img view-grid" />
          </button>
          <button
            className={classnames({ selected: viewType == "list" })}
            disabled={viewType == "list"}
            onClick={() => setViewType("list")}
          >
            <div className="img view-list" />
          </button>
        </div>
      </div>
    </header>
  );
}

function DashboardViewerContent({
  recordings,
  viewType,
  addSelectedId,
  removeSelectedId,
  selectedIds,
  setSelectedIds,
}) {
  const handleHeaderCheckboxClick = () => {
    if (selectedIds.length) {
      setSelectedIds([]);
    } else {
      console.log(recordings);
      setSelectedIds(recordings.map(r => r.recording_id));
    }
  };

  const ListHeader = (
    <header className="dashboard-viewer-content-header">
      <input type="checkbox" onChange={handleHeaderCheckboxClick} checked={selectedIds.length} />
      <div>PREVIEW</div>
      <div>TITLE</div>
      <div>PAGE TITLE</div>
      <div>DURATION</div>
      <div>CREATED</div>
      <div>PRIVACY</div>
      <div>OWNER</div>
    </header>
  );

  return (
    <section className="dashboard-viewer-content">
      <ul className={classnames("recording-list", viewType)}>
        {viewType == "list" ? ListHeader : null}
        {recordings &&
          recordings.map((recording, i) => (
            <Recording
              data={recording}
              key={i}
              viewType={viewType}
              addSelectedId={addSelectedId}
              removeSelectedId={removeSelectedId}
              selectedIds={selectedIds}
              selected={selectedIds.includes(recording.recording_id)}
            />
          ))}
      </ul>
    </section>
  );
}

export default Dashboard;
