type Tab = {
  id: string;
  title: string;
};

function PanelTab({
  activeTab,
  setActiveTab,
  tab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tab: Tab;
}) {
  const isActive = activeTab == tab.id;

  const className = `tabs-menu-item ${isActive && "is-active"}`;
  return (
    <li key={tab.id} className={className} role="presentation">
      <span className="devtools-tab-line"></span>
      <a
        id={`${tab.id}-tab`}
        onClick={() => setActiveTab(tab.id)}
        role="tab"
        tabIndex={0}
        title={tab.title}
      >
        {tab.title}
      </a>
    </li>
  );
}

export default function PanelTabs({
  activeTab,
  setActiveTab,
  tabs,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: Tab[];
}) {
  return (
    <div className="devtools-sidebar-tabs">
      <div className="tabs">
        <nav className="tabs-navigation">
          <ul className="tabs-menu" role="tablist">
            {tabs.map((tab: Tab) => (
              <PanelTab setActiveTab={setActiveTab} tab={tab} activeTab={activeTab} />
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
