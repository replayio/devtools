import React, { FC, ReactNode, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import classnames from "classnames";
import { UIState } from "ui/state";
import { setActiveTab } from "../actions";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import { prefs } from "devtools/client/inspector/prefs";
import MarkupApp from "devtools/client/inspector/markup/components/MarkupApp";
import { RulesApp } from "devtools/client/inspector/rules/components/RulesApp";
import ComputedApp from "devtools/client/inspector/computed/components/ComputedApp";
import LayoutApp from "devtools/client/inspector/layout/components/LayoutApp";
import { InspectorActiveTab } from "../state";

import "ui/setup/dynamic/inspector";
import { EventListenersApp } from "../event-listeners/EventListenersApp";
import { assert } from "protocol/utils";
import { ResponsiveTabs } from "../ResponsiveTabs";

const INSPECTOR_TAB_TITLES: Record<InspectorActiveTab, string> = {
  ruleview: "Rules",
  computedview: "Computed",
  layoutview: "Layout",
  eventsview: "Event Listeners",
} as const;

const availableTabs: readonly InspectorActiveTab[] = [
  "ruleview",
  "layoutview",
  "computedview",
  "eventsview",
] as const;

const InspectorApp: FC = () => {
  const dispatch = useDispatch();
  const { initializedPanels, activeTab } = useSelector((state: UIState) => ({
    initializedPanels: state.app.initializedPanels,
    activeTab: state.inspector.activeTab,
  }));

  const inspector = gToolbox.getPanel("inspector");
  const inspectorInited = inspector && initializedPanels.includes("inspector");

  const onSplitboxResize = (width: number) => {
    prefs.splitSidebarSize = width;
  };

  const markupView: JSX.Element | undefined = useMemo(() => {
    if (!inspectorInited) {
      return undefined;
    }
    return <MarkupApp inspector={inspector} />;
  }, [inspector, inspectorInited]);

  const activePanel: ReactNode = useMemo(() => {
    if (!inspectorInited) {
      return null;
    }

    switch (activeTab) {
      case "ruleview": {
        return <RulesApp {...inspector.rules.getRulesProps()} />;
      }
      case "computedview": {
        return <ComputedApp />;
      }
      case "layoutview": {
        const layoutProps = {
          ...inspector.getCommonComponentProps(),
          ...inspector.boxModel.getComponentProps(),
          showBoxModelProperties: true,
        };
        return <LayoutApp {...layoutProps} />;
      }
      case "eventsview": {
        return <EventListenersApp />;
      }
    }
    assert(
      false,
      "This code should be unreachable (handle all cases within the switch statement)."
    );
  }, [inspector, inspectorInited, activeTab]);

  return (
    <div
      className="inspector-responsive-container theme-body inspector"
      data-localization-bundle="devtools/client/locales/inspector.properties"
    >
      <div id="inspector-splitter-box">
        <SplitBox
          className="inspector-sidebar-splitter"
          initialSize={`${prefs.splitSidebarSize}px`}
          minSize="20%"
          maxSize="80%"
          onMove={onSplitboxResize}
          splitterSize={4}
          endPanelControl={true}
          startPanel={markupView}
          endPanel={
            <div className="devtools-inspector-tab-panel">
              <div id="inspector-sidebar-container">
                <div id="inspector-sidebar">
                  <div className="devtools-sidebar-tabs">
                    <div className="tabs">
                      <nav className="tabs-navigation">
                        <ResponsiveTabs
                          dropdownStyle={{
                            background: "var(--theme-tab-toolbar-background)",
                            border: "1px solid var(--theme-splitter-color)",
                            borderRadius: "0 0 5px 5px",
                            boxShadow: "3px 3px 3px 1px var(--popup-shadow-color)",
                          }}
                          activeIdx={availableTabs.indexOf(activeTab)}
                        >
                          {availableTabs.map(panelId => {
                            const isPanelSelected = activeTab === panelId;
                            return (
                              <li
                                key={panelId}
                                className={classnames("tabs-menu-item", {
                                  "is-active": isPanelSelected,
                                })}
                                role="presentation"
                              >
                                <span className="devtools-tab-line"></span>
                                <a
                                  id={`${panelId}-tab`}
                                  tabIndex={isPanelSelected ? 0 : -1}
                                  title={INSPECTOR_TAB_TITLES[panelId]}
                                  role="tab"
                                  onClick={() => dispatch(setActiveTab(panelId))}
                                >
                                  {INSPECTOR_TAB_TITLES[panelId]}
                                </a>
                              </li>
                            );
                          })}
                        </ResponsiveTabs>
                      </nav>
                      <div className="panels">
                        <div className="tab-panel-box" role="tabpanel">
                          {activePanel}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default InspectorApp;
