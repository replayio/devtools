import React from "react";
import { useDispatch } from "react-redux";
import { hideModal } from "ui/actions/app";

import { PrimaryButton } from "../shared/Button";
import Icon from "../shared/Icon";
import Modal from "../shared/NewModal";

export default function TimelineSlowModal() {
  const dispatch = useDispatch();
  const onMaskClick = () => dispatch(hideModal());

  const reload = () => {};

  return (
    <Modal onMaskClick={onMaskClick}>
      <div className="flex w-80 flex-col items-center gap-4 rounded-xl bg-modalBgcolor p-4">
        <Icon filename="replay-logo" className="h-16 w-16 bg-secondaryAccent" size="custom" />
        <div className="text-xl font-bold">Recording is loading slowly</div>
        <div className="text-sm">Sometimes reloading can fix it.</div>
        <PrimaryButton color="pink" onClick={reload}>
          Reload
        </PrimaryButton>
      </div>
    </Modal>
  );
}
