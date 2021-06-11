import React from "react";
const Dropdown = require("devtools/client/debugger/src/components/shared/Dropdown").default;
import classnames from "classnames";
import hooks from "ui/hooks";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { RecordingId } from "@recordreplay/protocol";
import { WorkspaceId } from "ui/state/app";

type BatchActionDropdownProps = PropsFromRedux & {
  selectedIds: RecordingId[];
  setSelectedIds: any;
};

function BatchActionDropdown({
  selectedIds,
  setSelectedIds,
  currentWorkspaceId,
}: BatchActionDropdownProps) {
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
    <div className="dropdown-panel">
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

const connector = connect((state: UIState) => ({
  currentWorkspaceId: selectors.getWorkspaceId(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(BatchActionDropdown);
