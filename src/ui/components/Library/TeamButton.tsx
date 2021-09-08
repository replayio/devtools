import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import * as actions from "ui/actions/app";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import SidebarButton from "./SidebarButton";
import classNames from "classnames";
import { Redacted } from "../Redacted";

type TeamButtonProps = PropsFromRedux & {
  text: string;
  isNew?: boolean;
  id: string | null;
};

function TeamButton({
  text,
  isNew,
  id,
  currentWorkspaceId,
  setWorkspaceId,
  setModal,
}: TeamButtonProps) {
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

  const badge = isNew && (
    <div className="text-xs bg-blue-500 text-white rounded-lg px-3 py-0.5">New</div>
  );

  return (
    <SidebarButton shouldHighlight={isSelected} onClick={handleTeamClick}>
      <Redacted>
        <div
          className={classNames(
            "overflow-hidden overflow-ellipsis whitespace-pre",
            currentWorkspaceId == id ? "font-bold" : ""
          )}
          title={text}
        >
          {text}
        </div>
      </Redacted>
      {badge}
      {showSettingsButton ? <SettingsButton onClick={handleSettingsClick} /> : null}
    </SidebarButton>
  );
}

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="material-icons ml-2 w-5 text-gray-200 transition duration-200 text-sm"
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
