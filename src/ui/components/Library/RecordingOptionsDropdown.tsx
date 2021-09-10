import React, { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { Recording } from "ui/types";
import classNames from "classnames";
import MaterialIcon from "../shared/MaterialIcon";
import hooks from "ui/hooks";
import { RecordingId } from "@recordreplay/protocol";
import { WorkspaceId } from "ui/state/app";

type RecordingOptionsDropdownProps = PropsFromRedux & {
  recording: Recording;
};

function Dropdown({
  button,
  children,
}: {
  button: React.ReactElement;
  children: React.ReactElement[];
}) {
  return (
    <Menu as="div" className="inline-block text-left recording-options">
      <div className="opacity-0 group-hover:opacity-100">
        <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
          {button}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={classNames(
            "mr-8",
            "origin-top-right text-sm absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
          )}
        >
          <div className="py-1">{children}</div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function DropdownItem({
  children,
  onClick,
}: {
  children: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <Menu.Item>
      {({ active }) => (
        <a
          href="#"
          className={classNames(
            active ? "bg-gray-100 text-gray-900" : "text-gray-700",
            "block px-4 py-2"
          )}
          onClick={onClick}
        >
          {children}
        </a>
      )}
    </Menu.Item>
  );
}

function RecordingOptionsDropdown({
  currentWorkspaceId,
  recording,
  setModal,
}: RecordingOptionsDropdownProps) {
  const [isPrivate, setIsPrivate] = useState(recording.private);
  const deleteRecording = hooks.useDeleteRecordingFromLibrary();
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();
  const updateIsPrivate = hooks.useUpdateIsPrivate();
  const recordingId = recording.id;

  const toggleIsPrivate = () => {
    setIsPrivate(!isPrivate);
    updateIsPrivate({ variables: { recordingId: recording.id, isPrivate: !isPrivate } });
  };

  const onDeleteRecording = (recordingId: RecordingId) => {
    const message =
      "This action will permanently delete this replay. \n\nAre you sure you want to proceed?";

    if (window.confirm(message)) {
      deleteRecording(recordingId, currentWorkspaceId);
    }
  };
  const updateRecording = (targetWorkspaceId: WorkspaceId | null) => {
    updateRecordingWorkspace(recordingId, currentWorkspaceId, targetWorkspaceId);
  };

  const button = (
    <MaterialIcon outlined className="h-4 w-4 hover:text-primaryAccentHover">
      more_vert
    </MaterialIcon>
  );

  return (
    <Dropdown button={button}>
      <DropdownItem onClick={() => onDeleteRecording(recordingId)}>Delete</DropdownItem>
      <DropdownItem onClick={toggleIsPrivate}>{`Make ${
        isPrivate ? "public" : "private"
      }`}</DropdownItem>
      <DropdownItem onClick={() => setModal("sharing", { recordingId })}>Share</DropdownItem>
      <div className="border-b border-gray-200 w-full" />
      <div className="overflow-y-auto max-h-48">
        {currentWorkspaceId !== null ? (
          <DropdownItem onClick={() => updateRecording(null)}>
            Move to your personal library
          </DropdownItem>
        ) : null}
        {!loading
          ? workspaces
              .filter(w => w.id !== currentWorkspaceId)
              .map(({ id, name }) => (
                <DropdownItem onClick={() => updateRecording(id)} key={id}>
                  {`Move to ${name}`}
                </DropdownItem>
              ))
          : null}
      </div>
    </Dropdown>
  );
}

const connector = connect(
  (state: UIState) => ({ currentWorkspaceId: selectors.getWorkspaceId(state) }),
  {
    setModal: actions.setModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(RecordingOptionsDropdown);
