import React, { Component, ReactElement } from "react";
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

export interface InspectorPanel {
  id: InspectorActiveTab;
  title: string;
  panel: ReactElement;
}

class InspectorApp extends Component<PropsFromRedux> {
  private sidebarContainerRef = React.createRef<HTMLDivElement>();
  private splitBoxRef = React.createRef<SplitBox>();
  private sidebarSplitboxRef = React.createRef<SplitBox>();

  private toggle3PaneMode = () => {
    const is3PaneMode = !this.props.is3PaneModeEnabled;
    const containerElement = this.sidebarContainerRef.current;
    const splitBox = this.splitBoxRef.current;
    const sidebarSplitbox = this.sidebarSplitboxRef.current;

    if (containerElement && splitBox && sidebarSplitbox) {
      if (is3PaneMode) {
        // In 2 pane mode, the size of the sidebar is stored in splitSidebarSize.
        // In 3 pane mode, it is stored in sidebarSize and the size of the right-most panel in splitSidebarSize.
        // The right-most panel's width should be at most 80% of the sidebar width.
        // The sidebar width should be at most 80% of the toolbar width.
        // We may have to make some adjustments to satisfy these constraints:
        if (prefs.splitSidebarSize > prefs.sidebarSize * 0.8) {
          // The right-most panel would occupy more than 80% of the sidebar...
          const toolboxWidth = containerElement.clientWidth;
          if (prefs.splitSidebarSize * 1.25 <= toolboxWidth * 0.8) {
            // Grow the sidebar so that the right-most panel will occupy exactly 80% of it
            prefs.sidebarSize = prefs.splitSidebarSize * 1.25;
          } else {
            // Growing the sidebar as above would make it bigger than 80% of the toolbar,
            // so we make it as big as possible and shrink the right-most panel to 80% of the sidebar
            prefs.sidebarSize = toolboxWidth * 0.8;
            prefs.splitSidebarSize = prefs.sidebarSize * 0.8;
          }
        }

        splitBox.setState({
          width: prefs.sidebarSize,
        });
        sidebarSplitbox.setState({
          endPanelControl: true,
          splitterSize: 8,
          width: prefs.splitSidebarSize,
        });
      } else {
        splitBox.setState({ width: prefs.splitSidebarSize });
        sidebarSplitbox.setState({
          endPanelControl: false,
          splitterSize: 0,
          width: 0,
        });
      }

      this.props.set3PaneMode(is3PaneMode);
    }
  };

  private onSplitboxResize = (width: number) => {
    const { is3PaneModeEnabled } = this.props;
    if (is3PaneModeEnabled) {
      prefs.sidebarSize = width;
    } else {
      prefs.splitSidebarSize = width;
    }
  };

  private onSidebarSplitboxResize = (width: number) => {
    prefs.splitSidebarSize = width;
  };

  renderSidebar() {
    const { initializedPanels, is3PaneModeEnabled, activeTab, setActiveTab } = this.props;

    const inspector = gToolbox.getPanel("inspector");
    let rulesPanel: InspectorPanel | null = null;
    let layoutPanel: InspectorPanel | null = null;
    let computedPanel: InspectorPanel | null = null;
    let eventListenersPanel: InspectorPanel | null = null;
    if (inspector && initializedPanels.includes("inspector")) {
      rulesPanel = {
        id: "ruleview",
        title: "Rules",
        panel: <RulesApp {...inspector.rules.getRulesProps()} />,
      };

      const layoutProps = {
        ...inspector.getCommonComponentProps(),
        ...inspector.boxModel.getComponentProps(),
        showBoxModelProperties: true,
      };
      layoutPanel = {
        id: "layoutview",
        title: "Layout",
        panel: <LayoutApp {...layoutProps} />,
      };

      computedPanel = {
        id: "computedview",
        title: "Computed",
        panel: <ComputedApp />,
      };

      eventListenersPanel = {
        id: "eventlistenersview",
        title: "Event Listeners",
        panel: <EventListenersApp />,
      };
    }

    const panels: InspectorPanel[] = [];
    if (rulesPanel && !is3PaneModeEnabled) {
      panels.push(rulesPanel);
    }
    if (computedPanel) {
      panels.push(computedPanel);
    }
    if (layoutPanel) {
      panels.push(layoutPanel);
    }
    if (eventListenersPanel) {
      panels.push(eventListenersPanel);
    }
    let activePanel: ReactElement | undefined;

    const tabs = panels.map(panel => {
      const isPanelSelected = activeTab === panel.id;
      if (isPanelSelected) {
        activePanel = (
          <div key={panel.id} className="tab-panel-box" role="tabpanel">
            {panel.panel}
          </div>
        );
      }

      return (
        <li
          key={panel.id}
          className={classnames("tabs-menu-item", { "is-active": isPanelSelected })}
          role="presentation"
        >
          <span className="devtools-tab-line"></span>
          <a
            id={`${panel.id}-tab`}
            tabIndex={isPanelSelected ? 0 : -1}
            title={panel.title}
            role="tab"
            onClick={() => setActiveTab(panel.id)}
          >
            {panel.title}
          </a>
        </li>
      );
    });

    return (
      <div className="devtools-sidebar-tabs">
        <div className="tabs">
          <nav className="tabs-navigation">
            {/* <SidebarToggle
              collapsed={!is3PaneModeEnabled}
              onClick={this.toggle3PaneMode}
              collapsePaneTitle={"Toggle off the 3-pane inspector"}
              expandPaneTitle={"Toggle on the 3-pane inspector"}
            /> */}
            <ul className="tabs-menu" role="tablist">
              {tabs}
            </ul>
          </nav>
          <div className="panels">{activePanel}</div>
        </div>
      </div>
    );
  }

  render() {
    const { initializedPanels, is3PaneModeEnabled } = this.props;

    const inspector = gToolbox.getPanel("inspector");
    let markupView, rulesView;
    if (inspector && initializedPanels.includes("inspector")) {
      markupView = <MarkupApp inspector={inspector} />;
      if (is3PaneModeEnabled) {
        rulesView = <RulesApp {...inspector.rules.getRulesProps()} />;
      }
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
            initialSize={`${is3PaneModeEnabled ? prefs.sidebarSize : prefs.splitSidebarSize}px`}
            minSize="20%"
            maxSize="80%"
            onMove={this.onSplitboxResize}
            splitterSize={8}
            endPanelControl={true}
            startPanel={markupView}
            endPanel={
              <SplitBox
                ref={this.sidebarSplitboxRef}
                initialSize={`${is3PaneModeEnabled ? prefs.splitSidebarSize : 0}px`}
                minSize={is3PaneModeEnabled ? "20%" : "0"}
                maxSize="80%"
                onMove={this.onSidebarSplitboxResize}
                splitterSize={is3PaneModeEnabled ? 8 : 0}
                endPanelControl={is3PaneModeEnabled}
                startPanel={
                  <div className="devtools-inspector-tab-panel">
                    <div id="inspector-rules-container">
                      <div id="inspector-rules-sidebar" hidden={false}>
                        {rulesView}
                      </div>
                    </div>
                  </div>
                }
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
    is3PaneModeEnabled: state.inspector.is3PaneModeEnabled,
    activeTab: state.inspector.activeTab,
    markupRootNode: state.markup.tree[state.markup.rootNode!],
  }),
  InspectorActions
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(InspectorApp);
