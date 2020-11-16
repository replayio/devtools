import React from "react";
import classnames from "classnames";
import { gql, useMutation } from "@apollo/client";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import "./DashboardViewerHeader.css";

const DELETE_RECORDING = gql`
  mutation DeleteRecording($recordingId: String) {
    delete_recordings(where: { recording_id: { _eq: $recordingId } }) {
      returning {
        id
      }
    }
  }
`;

function ViewsToggle({ viewType, toggleViewType }) {
  return (
    <div className="dashboard-viewer-header-views">
      <button
        className={classnames({ selected: viewType == "grid" })}
        disabled={viewType == "grid"}
        onClick={toggleViewType}
      >
        <div className="img view-grid" />
      </button>
      <button
        className={classnames({ selected: viewType == "list" })}
        disabled={viewType == "list"}
        onClick={toggleViewType}
      >
        <div className="img view-list" />
      </button>
    </div>
  );
}

function BatchActionDropdown({ selectedIds, setSelectedIds }) {
  const [deleteRecording] = useMutation(DELETE_RECORDING, {
    refetchQueries: ["GetMyRecordings"],
  });

  const deleteSelectedIds = () => {
    selectedIds.forEach(recordingId => deleteRecording({ variables: { recordingId } }));
    setSelectedIds([]);
  };

  const panel = (
    <div className="dropdown-panel">
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
    <div className="dashboard-viewer-header-batch-action">
      <Dropdown panel={panel} icon={icon} />
    </div>
  );
}

function HeaderActions({
  selectedIds,
  setSelectedIds,
  editing,
  toggleEditing,
  viewType,
  toggleViewType,
}) {
  return (
    <div className="dashboard-viewer-header-actions">
      {editing ? (
        <BatchActionDropdown setSelectedIds={setSelectedIds} selectedIds={selectedIds} />
      ) : null}
      <button
        className="toggle-editing"
        onClick={toggleEditing}
        style={{ visibility: viewType == "list" ? "visible" : "hidden" }}
      >
        {editing ? "Done" : "Edit"}
      </button>
      <ViewsToggle viewType={viewType} toggleViewType={toggleViewType} />
    </div>
  );
}

export default function DashboardViewerHeader({
  filter,
  selectedIds,
  setSelectedIds,
  editing,
  toggleEditing,
  viewType,
  toggleViewType,
}) {
  return (
    <header className="dashboard-viewer-header">
      <div className="dashboard-viewer-header-title">{filter == "" ? "All" : filter}</div>
      <HeaderActions
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        toggleEditing={toggleEditing}
        viewType={viewType}
        toggleViewType={toggleViewType}
      />
    </header>
  );
}
