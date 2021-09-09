import React from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import * as actions from "ui/actions/app";
import { getWorkspaceRoute, useGetSettingsTab, useGetWorkspaceId } from "ui/utils/routes";
import "./Modal.css";

interface ModalProps {
  hideModal(): any;
  showClose?: boolean;
  children?: React.ReactNode;
}

function Modal({ hideModal, children, showClose = true }: ModalProps) {
  const history = useHistory();
  const workspaceId = useGetWorkspaceId();
  const workspaceSettingsTab = useGetSettingsTab();
  function hideModalAndUpdateRoute() {
    hideModal();
    if (workspaceSettingsTab) {
      history.push(getWorkspaceRoute(workspaceId));
    }
  }
  return (
    <div className="modal-container">
      <div className="modal-mask" onClick={hideModalAndUpdateRoute} />
      <div className="modal-content text-sm">
        {showClose && (
          <button className="modal-close" onClick={hideModalAndUpdateRoute}>
            <div className="img close" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export default connect(null, { hideModal: actions.hideModal })(Modal);
