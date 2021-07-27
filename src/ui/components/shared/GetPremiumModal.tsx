import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import Modal from "./NewModal";

function GetPremiumModal({ hideModal }: GetPremiumModalProps) {
  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div
        className="p-12 bg-white rounded-lg shadow-xl text-xl space-y-8 relative flex flex-col justify-between"
        style={{ width: "520px" }}
      >
        <h1>WOMP WOMP</h1>
        <div>You should get premium.</div>
      </div>
    </Modal>
  );
}

const connector = connect(() => ({}), {
  hideModal: actions.hideModal,
});
export type GetPremiumModalProps = ConnectedProps<typeof connector>;

export default connector(GetPremiumModal);
