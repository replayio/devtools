import cx from "classnames";
import React from "react";

import { NetworkTab } from "ui/components/NetworkMonitor/RequestDetails";

type Tab = {
  id: NetworkTab;
  title: string;
  visible: boolean;
};

export default function PanelTabs({
  activeTab,
  dataTestName = "PanelTabs",
  setActiveTab,
  tabs,
}: {
  activeTab: string;
  dataTestName?: string;
  setActiveTab: (tab: NetworkTab) => void;
  tabs: readonly Tab[];
}) {
  return (
    <div className="devtools-sidebar-tabs">
      <div className="tabs">
        <nav className="tabs-navigation">
          <ul className="tabs-menu" role="tablist">
            {tabs
              .filter(t => t.visible)
              .map((tab: Tab) => (
                <li
                  key={tab.id}
                  className={cx("tabs-menu-item", { "is-active": activeTab == tab.id })}
                  role="presentation"
                >
                  <span className="devtools-tab-line"></span>
                  <button
                    id={`${tab.id}-tab`}
                    data-test-name={dataTestName}
                    data-test-selected={activeTab == tab.id || undefined}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    tabIndex={0}
                    title={tab.title}
                  >
                    {tab.title}
                  </button>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
