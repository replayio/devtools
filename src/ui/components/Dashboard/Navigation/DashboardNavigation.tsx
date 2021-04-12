import React, { Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import hooks from "ui/hooks";

import classnames from "classnames";
import WorkspaceDropdown from "./WorkspaceDropdown";
import Invitations from "./Invitations";
import "./DashboardNavigation.css";
import { Workspace } from "ui/types";

interface Recording {
  url: string;
}

function getUniqueHosts(recordings: Recording[]) {
  const uniqueUrls = recordings.reduce((acc, elem) => {
    const hostUrl = new URL(elem.url).host;

    if (acc.includes(hostUrl)) {
      return acc;
    } else {
      return [...acc, hostUrl];
    }
  }, [] as string[]);

  return uniqueUrls.filter(url => url != "").sort();
}

type DashboardNavigationProps = PropsFromRedux & {
  recordings: Recording[];
  filter: string;
  setFilter: Dispatch<SetStateAction<string>>;
};

function DashboardNavigation({
  currentWorkspaceId,
  recordings,
  filter,
  setFilter,
  setModal,
}: DashboardNavigationProps) {
  const { workspaces } = hooks.useGetNonPendingWorkspaces();
  const {
    userSettings: { enable_teams },
  } = hooks.useGetUserSettings();

  const isPersonal = currentWorkspaceId == null;
  const onSettingsClick = () => {
    setModal("workspace-settings");
  };

  if (!enable_teams) {
    return <nav className="left-sidebar"></nav>;
  }

  return (
    <nav className="left-sidebar">
      <WorkspaceDropdown />
      {workspaces && !isPersonal ? (
        <div className={classnames("left-sidebar-menu-item")} onClick={onSettingsClick}>
          <span className="material-icons">settings</span>
          <span>{`Settings & Members`}</span>
        </div>
      ) : null}
      <Invitations />
    </nav>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  { setModal: actions.setModal }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DashboardNavigation);
