import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { Menu } from "@headlessui/react";
import * as actions from "ui/actions/app";
import { PlusIcon } from "@heroicons/react/solid";
import classnames from "classnames";

type NewWorkspaceButtonProps = PropsFromRedux & {};

function NewWorkspaceButton({ setModal }: NewWorkspaceButtonProps) {
  const onClick = () => {
    setModal("new-workspace");
  };

  return (
    <Menu.Item>
      {({ active }) => (
        <a
          href="#"
          className={classnames(
            "flex flex-row px-4 py-2 text-md cursor-pointer space-x-3 items-center",
            active ? "bg-gray-100 text-gray-900" : "text-gray-700"
          )}
          onClick={onClick}
        >
          <PlusIcon className="w-6 h-6" />
          <div className="text-lg">Create a new team</div>
        </a>
      )}
    </Menu.Item>
  );
}
const connector = connect(null, {
  setModal: actions.setModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NewWorkspaceButton);
