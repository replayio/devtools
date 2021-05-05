import React from "react";
import classnames from "classnames";
import Invitations from "./Navigation/Invitations";
import "./DashboardViewerHeader.css";
import BatchActionDropdown from "./BatchActionDropdown";

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
      <HeaderActions
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        toggleEditing={toggleEditing}
        viewType={viewType}
        toggleViewType={toggleViewType}
      />
      <Invitations />
    </header>
  );
}
