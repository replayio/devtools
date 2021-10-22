import React from "react";
import { connect } from "react-redux";
import * as actions from "ui/actions/app";
import { Dialog } from "./Dialog";
import "./Modal.css";

interface ModalProps {
  hideModal(): any;
  showClose?: boolean;
  children?: React.ReactNode;
}

function Modal({ hideModal, children, showClose = true }: ModalProps) {
  return (
    <div className="modal-container">
      <div className="modal-mask" onClick={hideModal} />
      <Dialog className="modal-content text-sm">
        {showClose && (
          <button className="modal-close" onClick={hideModal}>
            <div className="img close" />
          </button>
        )}
        {children}
      </Dialog>
    </div>
  );
}

export default connect(null, { hideModal: actions.hideModal })(Modal);
