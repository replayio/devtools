import React from "react";
import classnames from "classnames";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import "./DashboardViewerHeader.css";
import hooks from "ui/hooks";

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
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();
  const deleteRecording = hooks.useDeleteRecording(["GetWorkspaceRecordings", "GetMyRecordings"]);

  if (loading) {
    return null;
  }

  const deleteSelectedIds = () => {
    selectedIds.forEach(recordingId =>
      deleteRecording({ variables: { recordingId, deletedAt: new Date().toISOString() } })
    );
    setSelectedIds([]);
  };
  const updateRecordings = workspaceId => {
    selectedIds.forEach(recordingId =>
      updateRecordingWorkspace({ variables: { recordingId, workspaceId: workspaceId } })
    );
    setSelectedIds([]);
  };

  const panel = (
    <div className="dropdown-panel">
      <div className="menu-item" onClick={deleteSelectedIds}>
        {`Delete ${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""}`}
      </div>
      <div className="menu-item" onClick={() => updateRecordings(null)}>
        {`Move ${selectedIds.length} item${
          selectedIds.length > 1 ? "s" : ""
        } to your personal workspace`}
      </div>
      {workspaces.map(({ id, name }) => (
        <div className="menu-item" onClick={() => updateRecordings(id)} key={id}>
          {`Move ${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""} to ${name}`}
        </div>
      ))}
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
      <Dropdown panel={panel} icon={icon} panelStyles={{ top: "36px" }} />
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
  recordings,
}) {
  return (
    <header className="dashboard-viewer-header">
      <div className="dashboard-viewer-header-title">
        {filter == "" ? "All" : filter}
        <span className="count">{`(${recordings.length})`}</span>
      </div>
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
