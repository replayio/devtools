import React from "react";
import classnames from "classnames";

function getUniqueHosts(recordings) {
  const uniqueUrls = recordings.reduce(
    (acc, elem) => (acc.includes(new URL(elem.url).host) ? acc : [...acc, new URL(elem.url).host]),
    []
  );

  return uniqueUrls.filter(url => url != "").sort();
}

export default function DashboardNavigation({ recordings, filter, setFilter }) {
  const hosts = getUniqueHosts(recordings);

  return (
    <nav className="left-sidebar">
      <div
        className={classnames("left-sidebar-menu-item", { active: filter == "" })}
        onClick={() => setFilter("")}
      >
        <div className="img document-text" />
        <span>All</span>
      </div>
      <div className="left-sidebar-menu-item disabled">
        <div className="img user-circle" />
        <span>Created by me</span>
      </div>
      <div className="left-sidebar-menu-item disabled">
        <div className="img users-2" />
        <span>Shared with me</span>
      </div>
      <hr />
      {hosts.map((hostUrl, i) => (
        <div
          className={classnames("left-sidebar-menu-item", { active: filter == hostUrl })}
          key={i}
          onClick={() => setFilter(hostUrl)}
        >
          <div className="img document" />
          <span>{hostUrl}</span>
        </div>
      ))}
    </nav>
  );
}
