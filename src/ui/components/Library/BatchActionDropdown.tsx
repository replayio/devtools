import React from "react";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import classnames from "classnames";
import hooks from "ui/hooks";
import { RecordingId } from "@recordreplay/protocol";
import { WorkspaceId } from "ui/state/app";
import { useGetWorkspaceId } from "ui/utils/routes";

import "./BatchActionDropdown.css";

interface BatchActionDropdownProps {
  selectedIds: RecordingId[];
  setSelectedIds: any;
}

export default function BatchActionDropdown({
  selectedIds,
  setSelectedIds,
}: BatchActionDropdownProps) {
  const currentWorkspaceId = useGetWorkspaceId();
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();
  const deleteRecording = hooks.useDeleteRecordingFromLibrary();

  if (loading) {
    return null;
  }

  const deleteSelectedIds = () => {
    const count = selectedIds.length;
    const message = `This action will permanently delete ${count == 1 ? "this" : count} replay${
      count == 1 ? "" : "s"
    }. \n\nAre you sure you want to proceed?`;

    if (window.confirm(message)) {
      selectedIds.forEach(recordingId => deleteRecording(recordingId, currentWorkspaceId));
      setSelectedIds([]);
    }
  };
  const updateRecordings = (targetWorkspaceId: WorkspaceId | null) => {
    selectedIds.forEach(recordingId =>
      updateRecordingWorkspace(recordingId, currentWorkspaceId, targetWorkspaceId)
    );
    setSelectedIds([]);
  };

  const panel = (
    <div className="dropdown-panel text-sm">
      <div className="menu-item" onClick={deleteSelectedIds}>
        {`Delete ${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""}`}
      </div>
      {currentWorkspaceId ? (
        <div className="menu-item" onClick={() => updateRecordings(null)}>
          {`Move ${selectedIds.length} item${
            selectedIds.length > 1 ? "s" : ""
          } to your personal workspace`}
        </div>
      ) : null}
      {workspaces
        .filter(w => w.id !== currentWorkspaceId)
        .map(({ id, name }) => (
          <div className="menu-item" onClick={() => updateRecordings(id)} key={id}>
            {`Move ${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""} to ${name}`}
          </div>
        ))}
    </div>
  );
  const icon = (
    <div
      className={classnames("flex flex-row space-x-2 items-center", {
        disabled: !selectedIds.length,
      })}
    >
      <div className="img chevron-down" />
      <span>{`${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""} selected`}</span>
    </div>
  );

  return (
    <div className="dashboard-viewer-header-batch-action text-base font-normal">
      <Dropdown panel={panel} icon={icon} panelStyles={{ top: "36px" }} />
    </div>
  );
}
