import React, { Component, ReactElement, ReactNode } from "react";
import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";
import { UIState } from "ui/state";
import * as InspectorActions from "../actions";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import { prefs } from "devtools/client/inspector/prefs";
import MarkupApp from "devtools/client/inspector/markup/components/MarkupApp";
import { RulesApp } from "devtools/client/inspector/rules/components/RulesApp";
import ComputedApp from "devtools/client/inspector/computed/components/ComputedApp";
import LayoutApp from "devtools/client/inspector/layout/components/LayoutApp";
import { EventListenersApp } from "../event-listeners/EventListenersApp";
import { selectors } from "ui/reducers";
import { InspectorActiveTab } from "../state";

import "ui/setup/dynamic/inspector";

const INSPECTOR_TAB_TITLES: Record<InspectorActiveTab, string> = {
  ruleview: "Rules",
  computedview: "Computed",
  layoutview: "Layout",
  eventlistenersview: "Event Listeners",
} as const;

class InspectorApp extends Component<PropsFromRedux> {
  private sidebarContainerRef = React.createRef<HTMLDivElement>();
  private splitBoxRef = React.createRef<SplitBox>();
  private sidebarSplitboxRef = React.createRef<SplitBox>();

  private onSplitboxResize = (width: number) => {
    prefs.splitSidebarSize = width;
  };

  private onSidebarSplitboxResize = (width: number) => {
    prefs.splitSidebarSize = width;
  };

  renderSidebar() {
    const { initializedPanels, activeTab, setActiveTab } = this.props;

    const inspector = gToolbox.getPanel("inspector");

    const availableTabs: readonly InspectorActiveTab[] = [
      "ruleview",
      "computedview",
      "layoutview",
      "eventlistenersview",
    ];

    let activePanel: ReactNode | null = null;
    if (inspector && initializedPanels.includes("inspector")) {
      switch (activeTab) {
        case "ruleview": {
          activePanel = <RulesApp {...inspector.rules.getRulesProps()} />;
          break;
        }

        case "computedview": {
          activePanel = <ComputedApp />;
          break;
        }

        case "layoutview": {
          const layoutProps = {
            ...inspector.getCommonComponentProps(),
            ...inspector.boxModel.getComponentProps(),
            showBoxModelProperties: true,
          };
          activePanel = <LayoutApp {...layoutProps} />;
          break;
        }

        case "eventlistenersview": {
          activePanel = <EventListenersApp />;
        }
      }
    }

    return (
      <div className="devtools-sidebar-tabs">
        <div className="tabs">
          <nav className="tabs-navigation">
            <ul className="tabs-menu" role="tablist">
              {availableTabs.map(panelId => {
                const isPanelSelected = activeTab === panelId;

                return (
                  <li
                    key={panelId}
                    className={classnames("tabs-menu-item", { "is-active": isPanelSelected })}
                    role="presentation"
                  >
                    <span className="devtools-tab-line"></span>
                    <a
                      id={`${panelId}-tab`}
                      tabIndex={isPanelSelected ? 0 : -1}
                      title={INSPECTOR_TAB_TITLES[panelId]}
                      role="tab"
                      onClick={() => setActiveTab(panelId)}
                    >
                      {INSPECTOR_TAB_TITLES[panelId]}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="panels">{activePanel}</div>
        </div>
      </div>
    );
  }

  render() {
    const { initializedPanels } = this.props;

    const inspector = gToolbox.getPanel("inspector");
    let markupView, rulesView;
    if (inspector && initializedPanels.includes("inspector")) {
      markupView = <MarkupApp inspector={inspector} />;
    }

    return (
      <div
        className="inspector-responsive-container theme-body inspector"
        data-localization-bundle="devtools/client/locales/inspector.properties"
      >
        <div id="inspector-splitter-box" ref={this.sidebarContainerRef}>
          <SplitBox
            ref={this.splitBoxRef}
            className="inspector-sidebar-splitter"
            initialSize={`${prefs.splitSidebarSize}px`}
            minSize="20%"
            maxSize="80%"
            onMove={this.onSplitboxResize}
            splitterSize={1}
            endPanelControl={true}
            startPanel={markupView}
            endPanel={
              <div className="devtools-inspector-tab-panel">
                <div id="inspector-sidebar-container">
                  <div id="inspector-sidebar" hidden={false}>
                    {this.renderSidebar()}
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
    );
  }
}

const connector = connect(
  (state: UIState) => ({
    initializedPanels: selectors.getInitializedPanels(state),
    activeTab: state.inspector.activeTab,
    markupRootNode: state.markup.tree[state.markup.rootNode!],
  }),
  InspectorActions
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(InspectorApp);
