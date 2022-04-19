import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

import Modal from "./NewModal";

function LoomModal({ hideModal, modalOptions }: PropsFromRedux) {
  if (!modalOptions || !modalOptions?.loom) {
    return null;
  }
  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div className="overflow-hidden rounded-lg" style={{ height: "680px", width: "940px" }}>
        <div style={{ height: 0, paddingBottom: "62.93706293706294%", position: "relative" }}>
          <iframe
            src={`https://www.loom.com/embed/${modalOptions.loom}`}
            allowFullScreen
            style={{ height: "100%", left: 0, position: "absolute", top: 0, width: "100%" }}
          ></iframe>
        </div>
      </div>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    modalOptions: selectors.getModalOptions(state),
  }),
  { hideModal: actions.hideModal }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(LoomModal);
