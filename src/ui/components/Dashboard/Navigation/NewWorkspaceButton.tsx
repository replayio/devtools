import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { Menu } from "@headlessui/react";
import * as actions from "ui/actions/app";
import { PlusIcon } from "@heroicons/react/solid";
import classnames from "classnames";

type NewWorkspaceButtonProps = PropsFromRedux & {};

function NewWorkspaceButton({ setModal }: NewWorkspaceButtonProps) {
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setModal("new-workspace");
  };

  return (
    <Menu.Item>
      {({ active }) => (
        <a
          href="#"
          className={classnames(
            "flex flex-row px-3 py-1.5 text-md cursor-pointer space-x-2.5 items-center",
            active ? "bg-gray-100 " : ""
          )}
          onClick={onClick}
        >
          <PlusIcon className="w-5 h-5" />
          <div>Create a new team</div>
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
