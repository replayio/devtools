import React from "react";
import "./Invitations.css";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import SidebarButton from "./SidebarButton";
import { Redacted } from "../Redacted";
import classNames from "classnames";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";

type PendingTeamsProps = PropsFromRedux & {
  text: string;
  id: string | null;
};

function PendingTeams({ text, setWorkspaceId, currentWorkspaceId, id }: PendingTeamsProps) {
  // const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const isSelected = currentWorkspaceId == id;

  const handleTeamClick = () => {};
  // const handleTeamClick = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   setWorkspaceId(id);
  //   updateDefaultWorkspace({
  //     variables: { workspaceId: id },
  //   });
  // };

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
      <div className="text-xs bg-blue-500 text-white rounded-lg px-3 py-0.5">New</div>
    </SidebarButton>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  { setWorkspaceId: actions.setWorkspaceId }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PendingTeams);
