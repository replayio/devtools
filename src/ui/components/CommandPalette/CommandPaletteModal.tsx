import React from "react";
import Modal from "../shared/NewModal";
import { actions } from "ui/actions";
import { useDispatch } from "react-redux";
import CommandPalette from ".";

export function CommandPaletteModal() {
  const dispatch = useDispatch();

  return (
    <Modal
      blurMask={false}
      options={{ maskTransparency: "translucent" }}
      onMaskClick={() => dispatch(actions.hideCommandPalette())}
    >
      <CommandPalette autoFocus />
    </Modal>
  );
}
