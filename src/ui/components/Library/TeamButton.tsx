import React from "react";
import { useHistory } from "react-router-dom";
import classNames from "classnames";
import { getWorkspaceRoute, getWorkspaceSettingsRoute, useGetWorkspaceId } from "ui/utils/routes";
import SidebarButton from "./SidebarButton";
import { Redacted } from "../Redacted";

interface TeamButtonProps {
  text: string;
  isNew?: boolean;
  id: string | null;
}

export default function TeamButton({ text, isNew, id }: TeamButtonProps) {
  const history = useHistory();
  const currentWorkspaceId = useGetWorkspaceId()!;
  // const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const isSelected = currentWorkspaceId == id;
  const showSettingsButton = id && isSelected && !isNew;

  const handleTeamClick = (e: React.MouseEvent) => {
    e.preventDefault();
    history.push(getWorkspaceRoute(id));

    // We only set the new team as the default team if this is a non-pending team.
    // Otherwise, it would be possible to set pending teams as a default team.
    if (!isNew) {
      // updateDefaultWorkspace({
      //   variables: { workspaceId: id },
      // });
    }
  };
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    history.push(getWorkspaceSettingsRoute(currentWorkspaceId));
  };

  const badge = isNew && (
    <div className="text-xs bg-blue-500 text-white rounded-lg px-3 py-0.5">New</div>
  );

  return (
    <SidebarButton shouldHighlight={isSelected} onClick={handleTeamClick}>
      <Redacted className="overflow-hidden">
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

function SettingsButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="material-icons ml-2 w-5 text-gray-200 transition duration-200 text-sm"
    >
      settings
    </button>
  );
}
