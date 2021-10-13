import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import * as actions from "ui/actions/app";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import SidebarButton from "./SidebarButton";
import classNames from "classnames";
import { Workspace } from "ui/types";
import { inUnpaidFreeTrial, subscriptionExpired } from "ui/utils/workspace";

function TeamButton({
  text,
  isNew,
  id,
  currentWorkspaceId,
  workspace,
  setWorkspaceId,
  setModal,
}: PropsFromRedux & {
  text: string;
  isNew?: boolean;
  id: string | null;
  workspace?: Workspace;
}) {
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const isSelected = currentWorkspaceId == id;
  const showSettingsButton = id && isSelected && !isNew;

  const handleTeamClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setWorkspaceId(id);

    // We only set the new team as the default team if this is a non-pending team.
    // Otherwise, it would be possible to set pending teams as a default team.
    if (!isNew) {
      updateDefaultWorkspace({
        variables: { workspaceId: id },
      });
    }
  };
  const handleSettingsClick = () => {
    setModal("workspace-settings");
  };

  let badge =
    workspace && inUnpaidFreeTrial(workspace)
      ? "(Trial)"
      : workspace && subscriptionExpired(workspace)
      ? "(Expired)"
      : "";

  return (
    <SidebarButton shouldHighlight={isSelected} onClick={handleTeamClick}>
      <div
        className={classNames(
          "overflow-hidden overflow-ellipsis whitespace-pre",
          currentWorkspaceId == id ? "font-bold" : ""
        )}
        title={text}
      >
        {`${text} ${badge}`}
      </div>
      <div className="flex flex-row space-x-1">
        {isNew ? (
          <div className={"text-xs rounded-lg px-3 py-0.5 text-white newbadge"}>New</div>
        ) : null}
        {showSettingsButton ? <SettingsButton onClick={handleSettingsClick} /> : null}
      </div>
    </SidebarButton>
  );
}

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="material-icons w-5 text-gray-200 transition duration-200 text-sm"
    >
      settings
    </button>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  { setWorkspaceId: actions.setWorkspaceId, setModal: actions.setModal }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TeamButton);
