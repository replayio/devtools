import React, { useState } from "react";
import classnames from "classnames";
import DashboardViewerHeader from "./DashboardViewerHeader";
import DashboardViewerContent from "./DashboardViewerContent";

export default function DashboardViewer({ recordings, filter }) {
  const [viewType, setViewType] = useState("list");
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleEditing = () => {
    if (editing) {
      setSelectedIds([]);
    }
    setEditing(!editing);
  };
  const toggleViewType = () => {
    if (editing) {
      setEditing(false);
    }

    setViewType(viewType == "list" ? "grid" : "list");
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
        toggleViewType={toggleViewType}
        recordings={recordings}
      />
      <DashboardViewerContent
        recordings={recordings}
        viewType={viewType}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
      />
    </div>
  );
}
