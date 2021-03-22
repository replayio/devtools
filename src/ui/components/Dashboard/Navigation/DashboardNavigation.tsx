import React, { Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import useToken from "ui/utils/useToken";

import classnames from "classnames";
import WorkspaceDropdown from "./WorkspaceDropdown";
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
  const { claims } = useToken();
  const userId = claims?.hasura.userId;
  const { invitations, loading } = hooks.useGetPendingWorkspaceInvitations();
  const acceptPendingInvitation = hooks.useAcceptPendingInvitation();
  const hosts = getUniqueHosts(recordings);

  const onSettingsClick = () => {
    setModal("workspace-settings");
  };

  console.log(!loading && invitations?.length > 0, { loading, invitations });

  return (
    <nav className="left-sidebar">
      {features.workspaces ? <WorkspaceDropdown /> : null}
      {features.workspaces && currentWorkspaceId !== "personal" ? (
        <div className={classnames("left-sidebar-menu-item")} onClick={onSettingsClick}>
          <span className="material-icons">settings</span>
          <span>{`Settings & Members`}</span>
        </div>
      ) : null}
      <div className="replays">
        <div className="navigation-subheader">REPLAYS</div>
        <div
          className={classnames("left-sidebar-menu-item", { active: filter == "" })}
          onClick={() => setFilter("")}
        >
          <span className="material-icons">home</span>
          <span>All</span>
        </div>
      </div>
      <div className="recording-hosts">
        <div className="navigation-subheader">BY URL</div>
        {hosts.map((hostUrl, i) => (
          <div
            className={classnames("left-sidebar-menu-item", { active: filter == hostUrl })}
            key={i}
            onClick={() => setFilter(hostUrl)}
          >
            <span className="material-icons">description</span>
            <span>{hostUrl}</span>
          </div>
        ))}
      </div>
      {!loading && invitations?.length > 0 ? (
        <div className="workspace-invites">
          <div className="navigation-subheader">INVITATIONS</div>
          {invitations.map((workspace, i) => (
            <div className={classnames("left-sidebar-menu-item")} key={i}>
              <span className="material-icons">description</span>
              <span>{workspace.workspace.name}</span>
              <span>Refuse</span>
              <span
                onClick={() =>
                  acceptPendingInvitation({
                    variables: { workspaceId: workspace.workspace_id, userId: workspace.user_id },
                  })
                }
              >
                Accept
              </span>
            </div>
          ))}
        </div>
      ) : null}
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
