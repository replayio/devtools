import React, { Dispatch, ReactElement, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { Menu } from "@headlessui/react";
import { Workspace } from "ui/types";
import { UserGroupIcon, UserIcon } from "@heroicons/react/solid";
import classnames from "classnames";
const { prefs } = require("ui/utils/prefs");

type WorkspaceItemProps = PropsFromRedux & {
  workspace: Workspace | { id: null; name: string; members: never[] };
};

function WorkspaceItem({ workspace, currentWorkspaceId, setWorkspaceId }: WorkspaceItemProps) {
  const onClick = () => {
    setWorkspaceId(workspace.id);
    prefs.defaultLibraryTeam = JSON.stringify(workspace.id);
  };

  let icon: ReactElement;

  if (workspace.id == null) {
    icon = <UserIcon className="w-6 h-6" />;
  } else {
    icon = <UserGroupIcon className="w-6 h-6" />;
  }

  return (
    <Menu.Item>
      {({ active }) => (
        <a
          href="#"
          className={classnames(
            "flex flex-row px-4 py-2 text-md cursor-pointer space-x-3 text-lg items-center",
            active ? "bg-gray-100 text-gray-900" : "text-gray-700",
            currentWorkspaceId == workspace.id ? "font-semibold" : ""
          )}
          onClick={onClick}
        >
          {icon}
          <div>{workspace.name}</div>
        </a>
      )}
    </Menu.Item>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  { setWorkspaceId: actions.setWorkspaceId }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(WorkspaceItem);
