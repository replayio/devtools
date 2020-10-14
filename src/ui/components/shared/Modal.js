import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import { actions } from "ui/actions";
import "./Modal.css";

function Modal({ hideModal, children }) {
  return (
    <div className="modal-container">
      <div className="modal-mask" onClick={hideModal} />
      <div className="modal-content">
        <button className="modal-close" onClick={hideModal}>
          <div className="img close" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default connect(null, { hideModal: actions.hideModal })(Modal);
