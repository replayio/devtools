import React, { Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import hooks from "ui/hooks";

import classnames from "classnames";
import WorkspaceDropdown from "./WorkspaceDropdown";
import Invitations from "./Invitations";
const { features } = require("ui/utils/prefs");
import "./DashboardNavigation.css";

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
  const { workspaces, loading: nonPendingLoading } = hooks.useGetNonPendingWorkspaces();
  const {
    userSettings: { enable_teams, loading },
  } = hooks.useGetUserSettings();
  const hosts = getUniqueHosts(recordings);

  const isPersonal = currentWorkspaceId == null;
  const onSettingsClick = () => {
    setModal("workspace-settings");
  };

  return (
    <nav className="left-sidebar">
      {enable_teams ? <WorkspaceDropdown /> : null}
      {enable_teams && workspaces && !isPersonal ? (
        <div className={classnames("left-sidebar-menu-item")} onClick={onSettingsClick}>
          <span className="material-icons">settings</span>
          <span>{`Settings & Members`}</span>
        </div>
      ) : null}
      {enable_teams ? <Invitations /> : null}
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
