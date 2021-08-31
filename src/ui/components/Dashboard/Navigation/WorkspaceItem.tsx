import React, { Dispatch, ReactElement, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import * as actions from "ui/actions/app";
import { UIState } from "ui/state";
import { Menu } from "@headlessui/react";
import { Workspace } from "ui/types";
import { Redacted } from "ui/components/Redacted";
import { UserGroupIcon, UserIcon } from "@heroicons/react/solid";
import classnames from "classnames";
import hooks from "ui/hooks";

type WorkspaceItemProps = PropsFromRedux & {
  workspace: Workspace | { id: null; name: string; members: never[] };
};

function WorkspaceItem({ workspace, currentWorkspaceId, setWorkspaceId }: WorkspaceItemProps) {
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setWorkspaceId(workspace.id);
    updateDefaultWorkspace({
      variables: { workspaceId: workspace.id },
    });
  };

  let icon: ReactElement;

  if (workspace.id == null) {
    icon = <UserIcon className="w-5 h-5 flex-shrink-0" />;
  } else {
    icon = <UserGroupIcon className="w-5 h-5 flex-shrink-0" />;
  }

  return (
    <Menu.Item>
      {({ active }) => (
        <a
          href="#"
          className={classnames(
            "flex flex-row px-3 py-1.5 text-md cursor-pointer space-x-2.5 text-sm items-center",
            active ? "bg-gray-100 " : "",
            currentWorkspaceId == workspace.id ? "font-semibold" : ""
          )}
          onClick={onClick}
        >
          {icon}
          <Redacted>
            <div className="overflow-ellipsis overflow-hidden whitespace-pre">{workspace.name}</div>
          </Redacted>
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
