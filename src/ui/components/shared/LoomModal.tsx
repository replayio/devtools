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
      <div className="overflow-hidden rounded-lg" style={{ width: "940px", height: "680px" }}>
        <div style={{ position: "relative", paddingBottom: "62.93706293706294%", height: 0 }}>
          <iframe
            src={`https://www.loom.com/embed/${modalOptions.loom}`}
            allowFullScreen
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
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
