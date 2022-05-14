import React from "react";
import { useDispatch } from "react-redux";
import { hideModal } from "ui/actions/app";

import Icon from "../shared/Icon";
import Modal from "../shared/NewModal";

export default function TimelineSlowModal() {
  const dispatch = useDispatch();
  const onMaskClick = () => dispatch(hideModal());

  return (
    <Modal onMaskClick={onMaskClick}>
      <div className="modal-drop-shadow flex w-80 flex-col items-center gap-4 rounded-xl bg-modalBgcolor p-4">
        <Icon filename="replay-logo" className="h-16 w-16 bg-secondaryAccent" size="custom" />
        <div className="text-xl font-bold">Loading</div>
        <div className="text-sm">
          Loading is going slower than expected. Try using{" "}
          <a
            href="https://docs.replay.io/docs/viewer-26591deb256c473a946d0f64abb67859#bf19baaa57004b0d9282cc0a02b281f5"
            rel="noreferrer noopener"
            style={{ textDecoration: "underline" }}
            target="_blank"
          >
            Focus Mode
          </a>{" "}
          to narrow down further, and please let us know on our{" "}
          <a
            href="https://replay.io/discord"
            rel="noreferrer noopener"
            style={{ textDecoration: "underline" }}
            target="_blank"
          >
            Discord
          </a>{" "}
          if you think something is wrong.
        </div>
      </div>
    </Modal>
  );
}
