import React, { Component, ReactElement } from "react";
import { connect, ConnectedProps } from "react-redux";
const classnames = require("classnames");
import { UIState } from "ui/state";
import * as InspectorActions from "../actions";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import SidebarToggle from "devtools/client/shared/components/SidebarToggle";
// const InspectorTabPanel = require("devtools/client/inspector/components/InspectorTabPanel");
// import InspectorTabs from "./InspectorTabs";
const { LocalizationHelper } = require("devtools/shared/l10n");
const INSPECTOR_L10N = new LocalizationHelper("devtools/client/locales/inspector.properties");

export interface InspectorPanel {
  id: string;
  title: string;
  panel: ReactElement;
  destroy(): void;
}

interface Panels {
  markupView?: ReactElement;
  rulesPanel?: InspectorPanel;
  layoutPanel?: InspectorPanel;
  computedPanel?: InspectorPanel;
}

class InspectorApp extends Component<PropsFromRedux & Panels> {
  private sidebarContainerRef = React.createRef<HTMLDivElement>();
  private splitBoxRef = React.createRef<SplitBox>();
  private sidebarSplitboxRef = React.createRef<SplitBox>();

  private toggle3PaneMode = () => {
    const is3PaneMode = !this.props.is3PaneModeEnabled;
    const containerElement = this.sidebarContainerRef.current;
    const splitBox = this.splitBoxRef.current;
    const sidebarSplitbox = this.sidebarSplitboxRef.current;

    if (containerElement && splitBox && sidebarSplitbox) {
      const toolboxWidth = containerElement.clientWidth;
      const sidebarWidth = splitBox.state.width;
      const canDoubleSidebarWidth = sidebarWidth * 2 < toolboxWidth / 2;

      if (is3PaneMode) {
        splitBox.setState({
          width: canDoubleSidebarWidth ? sidebarWidth * 2 : (toolboxWidth * 2) / 3,
        });
        sidebarSplitbox.setState({
          endPanelControl: true,
          splitterSize: 1,
          width: canDoubleSidebarWidth ? sidebarWidth : toolboxWidth / 3,
        });
      } else {
        splitBox.setState({ width: sidebarSplitbox.state.width });
        sidebarSplitbox.setState({
          endPanelControl: false,
          splitterSize: 0,
          width: 0,
        });
      }

      this.props.set3PaneMode(is3PaneMode);
    }
  };

  renderMarkupPanel() {
    const { markupView, markupRootNode } = this.props;

    return (
      <div className="devtools-inspector-tab-panel">
        <div id="inspector-main-content" className="devtools-main-content">
          <div id="inspector-toolbar" className="devtools-toolbar devtools-input-toolbar">
            <div id="inspector-search" className="devtools-searchbox">
              <input
                id="inspector-searchbox"
                className="devtools-searchinput"
                type="search"
                data-localization="placeholder=inspectorSearchHTML.label3"
              />
              <button
                id="inspector-searchinput-clear"
                className="devtools-searchinput-clear"
                hidden={true}
                tabIndex={-1}
              ></button>
            </div>
            <div id="inspector-searchlabel-container" hidden={true}>
              <div className="devtools-separator"></div>
              <span id="inspector-searchlabel"></span>
            </div>
            <div className="devtools-separator" hidden={true}></div>
            <button
              id="inspector-element-add-button"
              className="devtools-button"
              data-localization="title=inspectorAddNode.label"
              hidden={true}
            ></button>
            <button
              id="inspector-eyedropper-toggle"
              className="devtools-button"
              hidden={true}
            ></button>
          </div>
          <div id="markup-box" className="theme-body devtools-monospace">
            <div id="markup-root-wrapper" role="presentation">
              <div id="markup-root" role="presentation">
                {markupView}
              </div>
            </div>
            <a id="markup-loading" hidden={markupRootNode?.children.length > 0}>
              Loading…
            </a>
          </div>
          <div id="inspector-breadcrumbs-toolbar" className="devtools-toolbar">
            <div
              id="inspector-breadcrumbs"
              className="breadcrumbs-widget-container"
              role="toolbar"
              data-localization="aria-label=inspector.breadcrumbs.label"
              tabIndex={0} //TODO breadcrumbs
            ></div>
          </div>
        </div>
      </div>
    );
  }

  renderSidebar() {
    const {
      rulesPanel,
      layoutPanel,
      computedPanel,
      is3PaneModeEnabled,
      activeTab,
      setActiveTab,
    } = this.props;

    const panels: InspectorPanel[] = [];
    if (rulesPanel && !is3PaneModeEnabled) {
      panels.push(rulesPanel);
    }
    if (layoutPanel) {
      panels.push(layoutPanel);
    }
    if (computedPanel) {
      panels.push(computedPanel);
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

      const className = classnames("tabs-menu-item", isPanelSelected ? "is-active" : undefined);

      return (
        <li key={panel.id} className={className} role="presentation">
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
            <SidebarToggle
              collapsed={!is3PaneModeEnabled}
              onClick={this.toggle3PaneMode}
              collapsePaneTitle={INSPECTOR_L10N.getStr("inspector.hideThreePaneMode")}
              expandPaneTitle={INSPECTOR_L10N.getStr("inspector.showThreePaneMode")}
            />
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
    const { rulesPanel, is3PaneModeEnabled } = this.props;

    return (
      <div
        className="inspector-responsive-container theme-body inspector"
        data-localization-bundle="devtools/client/locales/inspector.properties"
      >
        <div id="inspector-splitter-box" ref={this.sidebarContainerRef}>
          <SplitBox
            ref={this.splitBoxRef}
            className="inspector-sidebar-splitter"
            initialSize="700"
            minSize="10%"
            maxSize="80%"
            splitterSize={1}
            endPanelControl={true}
            startPanel={this.renderMarkupPanel()}
            endPanel={
              <SplitBox
                ref={this.sidebarSplitboxRef}
                initialSize="350"
                minSize={is3PaneModeEnabled ? 10 : 0}
                maxSize="80%"
                splitterSize={is3PaneModeEnabled ? 1 : 0}
                endPanelControl={is3PaneModeEnabled}
                startPanel={
                  <div className="devtools-inspector-tab-panel">
                    <div id="inspector-rules-container">
                      <div id="inspector-rules-sidebar" hidden={false}>
                        {is3PaneModeEnabled ? rulesPanel?.panel : null}
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
    is3PaneModeEnabled: state.inspector.is3PaneModeEnabled,
    activeTab: state.inspector.activeTab,
    markupRootNode: state.markup.tree[state.markup.rootNode],
  }),
  InspectorActions
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(InspectorApp);
