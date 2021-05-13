import React from "react";
import "./DashboardViewerHeader.css";
import BatchActionDropdown from "./BatchActionDropdown";
import "./DashboardViewerHeader.css";

function HeaderActions({ selectedIds, setSelectedIds, editing, toggleEditing }) {
  return (
    <div className="dashboard-viewer-header-actions">
      {editing ? (
        <BatchActionDropdown setSelectedIds={setSelectedIds} selectedIds={selectedIds} />
      ) : null}
      <button className="toggle-editing" onClick={toggleEditing}>
        {editing ? "Done" : "Edit"}
      </button>
    </div>
  );
}

export default function DashboardViewerHeader({
  selectedIds,
  setSelectedIds,
  editing,
  toggleEditing,
  filters,
}) {
  return (
    <header className="dashboard-viewer-header">
      <HeaderActions
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        toggleEditing={toggleEditing}
      />
      <div className="flex flex-row space-x-8 items-center">{filters}</div>
    </header>
  );
}
