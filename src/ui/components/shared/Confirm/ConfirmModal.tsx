import React from "react";
import Modal from "../NewModal";
import { ConfirmDialog, ConfirmOptions } from "./ConfirmDialog";

export const ConfirmModal = ({ onDecline, ...props }: ConfirmOptions) => {
  return (
    <Modal
      onMaskClick={onDecline}
      options={{ maskTransparency: "translucent" }}
      style={{ zIndex: 100 }}
    >
      <ConfirmDialog {...props} onDecline={onDecline} />
    </Modal>
  );
};
