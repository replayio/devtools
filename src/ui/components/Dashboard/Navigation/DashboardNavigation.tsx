import React, { Dispatch, SetStateAction } from "react";
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

interface DashboardNavigationProps {
  recordings: Recording[];
  filter: string;
  setFilter: Dispatch<SetStateAction<string>>;
}

export default function DashboardNavigation({
  recordings,
  filter,
  setFilter,
}: DashboardNavigationProps) {
  const hosts = getUniqueHosts(recordings);

  return (
    <nav className="left-sidebar">
      {features.workspaces ? <WorkspaceDropdown /> : null}
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
    </nav>
  );
}
