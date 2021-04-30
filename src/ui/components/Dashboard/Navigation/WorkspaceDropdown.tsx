import React from "react";
import NewWorkspaceButton from "./NewWorkspaceButton";
import WorkspaceItem from "./WorkspaceItem";
import WorkspaceDropdownButton from "./WorkspaceDropdownButton";
import { Workspace } from "ui/types";
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";

export default function WorkspaceDropdown({
  nonPendingWorkspaces,
}: {
  nonPendingWorkspaces: Workspace[];
}) {
  const workspaces = [{ id: null, name: "Your Library", members: [] }, ...nonPendingWorkspaces];

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <div>
            <WorkspaceDropdownButton workspaces={workspaces} />
          </div>
          <Transition
            show={open}
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              static
              className="origin-top-right absolute left-0 z-10 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none select-none"
            >
              <div className="py-1">
                {workspaces.map((workspace, i) => (
                  <WorkspaceItem workspace={workspace} key={i} />
                ))}
              </div>
              <div className="py-1">
                <NewWorkspaceButton />
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
}
