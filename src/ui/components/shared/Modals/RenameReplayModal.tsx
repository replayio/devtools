import classNames from "classnames";
import React, { ChangeEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideModal } from "ui/actions/app";
import { useUpdateRecordingTitle } from "ui/hooks/recordings";
import { getModalOptions } from "ui/reducers/app";
import { PrimaryButton, SecondaryButton } from "../Button";
import { Dialog, DialogActions, DialogTitle } from "../Dialog";
import { TextInput } from "../Forms";
import Modal from "../NewModal";

function RenameReplayModal({
  recordingId,
  initialTitle,
}: {
  recordingId: string;
  initialTitle: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const dispatch = useDispatch();
  const updateRecordingTitle = useUpdateRecordingTitle();

  const dismissModal = () => dispatch(hideModal());
  const onChange = (e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value);
  const onSave = () => {
    updateRecordingTitle(recordingId, title);
    dismissModal();
  };

  return (
    <Modal onMaskClick={dismissModal} options={{ maskTransparency: "translucent" }}>
      <Dialog
        className={classNames("flex flex-col items-center")}
        style={{ animation: "dropdownFadeIn ease 200ms", width: 400 }}
      >
        <DialogTitle>Edit Replay</DialogTitle>
        <TextInput value={title} onChange={onChange} autoFocus />
        <DialogActions>
          <div className="w-full flex flex-row justify-center space-x-2">
            <SecondaryButton color="blue" onClick={dismissModal}>{`Cancel`}</SecondaryButton>
            <PrimaryButton color="blue" onClick={onSave}>{`Save`}</PrimaryButton>
          </div>
        </DialogActions>
      </Dialog>
    </Modal>
  );
}

export default function RenameReplayModalWrapper() {
  const options = useSelector(getModalOptions);
  const dispatch = useDispatch();
  const dismissModal = () => dispatch(hideModal());

  if (!options || !options.recordingId) {
    dismissModal();
    return null;
  }

  return <RenameReplayModal recordingId={options.recordingId} initialTitle={options.title || ""} />;
}
