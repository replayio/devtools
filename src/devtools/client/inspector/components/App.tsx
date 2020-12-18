import React, { Component, ReactElement } from "react";
import { connect, ConnectedProps } from "react-redux";
const classnames = require("classnames");
import { UIState } from "ui/state";
import * as InspectorActions from "../actions";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import SidebarToggle from "devtools/client/shared/components/SidebarToggle";
const { prefs } = require("devtools/client/inspector/prefs");
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
          splitterSize: 1,
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
    const { markupView, rulesPanel, is3PaneModeEnabled } = this.props;

    return (
      <div
        className="inspector-responsive-container theme-body inspector"
        data-localization-bundle="devtools/client/locales/inspector.properties"
      >
        <div id="inspector-splitter-box" ref={this.sidebarContainerRef}>
          <SplitBox
            ref={this.splitBoxRef}
            className="inspector-sidebar-splitter"
            initialSize={`${is3PaneModeEnabled ? prefs.sidebarSize : prefs.splitSidebarSize}`}
            minSize="10%"
            maxSize="80%"
            onMove={this.onSplitboxResize}
            splitterSize={1}
            endPanelControl={true}
            startPanel={markupView}
            endPanel={
              <SplitBox
                ref={this.sidebarSplitboxRef}
                initialSize={`${is3PaneModeEnabled ? prefs.splitSidebarSize : 0}`}
                minSize={is3PaneModeEnabled ? "20%" : "0"}
                maxSize="80%"
                onMove={this.onSidebarSplitboxResize}
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
    markupRootNode: state.markup.tree[state.markup.rootNode!],
  }),
  InspectorActions
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(InspectorApp);
