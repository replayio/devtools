import React, { Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";

type WorkspaceItemProps = PropsFromRedux & {
  icon: JSX.Element;
  subtitle: string;
  title: string;
  workspaceId: string | null;
  setExpanded: Dispatch<SetStateAction<boolean>>;
};

function WorkspaceItem({
  icon,
  subtitle,
  title,
  workspaceId,
  currentWorkspaceId,
  setExpanded,
  setWorkspaceId,
}: WorkspaceItemProps) {
  const isSelected = workspaceId == currentWorkspaceId;
  const onClick = () => {
    setExpanded(false);
    setWorkspaceId(workspaceId);
  };

  return (
    <div className="workspace-item" onClick={onClick}>
      {icon}
      <div className="workspace-profile-content">
        <div className="title">{title}</div>
        <div className="subtitle">{subtitle}</div>
      </div>
      {isSelected ? <div className="material-icons">check</div> : null}
    </div>
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
