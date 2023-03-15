import classNames from "classnames";
import React, { ChangeEvent, useState } from "react";

import { hideModal } from "ui/actions/app";
import { useUpdateRecordingTitle } from "ui/hooks/recordings";
import { getModalOptions } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

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
  const dispatch = useAppDispatch();
  const updateRecordingTitle = useUpdateRecordingTitle();

  const dismissModal = () => dispatch(hideModal());
  const onChange = (e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value);
  const onSave = () => {
    updateRecordingTitle(recordingId, title);
    dismissModal();
  };

  return (
    <Modal onMaskClick={dismissModal} options={{ maskTransparency: "translucent" }}>
      <Dialog>
        <div className="mb-1 w-full px-2 text-left text-lg font-medium">Rename</div>
        <div className="flex w-full items-center px-2">
          <div className="flex-1">
            <TextInput value={title} onChange={onChange} autoFocus />
          </div>
          <div className="gap-3 px-2">
            <PrimaryButton color="blue" onClick={onSave}>{`Save`}</PrimaryButton>
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}

export default function RenameReplayModalWrapper() {
  const options = useAppSelector(getModalOptions);
  const dispatch = useAppDispatch();
  const dismissModal = () => dispatch(hideModal());

  if (!options || !options.recordingId) {
    dismissModal();
    return null;
  }

  return <RenameReplayModal recordingId={options.recordingId} initialTitle={options.title || ""} />;
}
