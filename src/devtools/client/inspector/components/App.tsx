import "ui/setup/dynamic/inspector";
import classnames from "classnames";
import React, { FC, ReactNode, useMemo } from "react";

import ComputedApp from "devtools/client/inspector/computed/components/ComputedApp";
import LayoutApp from "devtools/client/inspector/layout/components/LayoutApp";
import MarkupApp from "devtools/client/inspector/markup/components/MarkupApp";
import { prefs } from "devtools/client/inspector/prefs";
import { RulesApp } from "devtools/client/inspector/rules/components/RulesApp";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import { assert } from "protocol/utils";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { ResponsiveTabs } from "../../shared/components/ResponsiveTabs";
import { setActiveTab } from "../actions";
import { EventListenersApp } from "../event-listeners/EventListenersApp";
import { InspectorActiveTab } from "../reducers";

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
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(state => state.inspector.activeTab);

  const onSplitboxResize = (width: number) => {
    prefs.splitSidebarSize = width;
  };

  const markupView: JSX.Element | undefined = useMemo(() => {
    return <MarkupApp />;
  }, []);

  const activePanel: ReactNode = useMemo(() => {
    switch (activeTab) {
      case "ruleview": {
        return <RulesApp />;
      }
      case "computedview": {
        return <ComputedApp />;
      }
      case "layoutview": {
        return <LayoutApp showBoxModelProperties={true} />;
      }
      case "eventsview": {
        return <EventListenersApp />;
      }
    }
    assert(
      false,
      "This code should be unreachable (handle all cases within the switch statement)."
    );
  }, [activeTab]);

  return (
    <div className="inspector-responsive-container theme-body inspector">
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
                      <nav
                        className="tabs-navigation"
                        style={{
                          borderBottom: "1px solid var(--theme-splitter-color)",
                        }}
                      >
                        <ResponsiveTabs activeIdx={availableTabs.indexOf(activeTab)}>
                          {availableTabs.map(panelId => {
                            const isPanelSelected = activeTab === panelId;
                            return (
                              <span
                                key={panelId}
                                className={classnames("tabs-menu-item", {
                                  "is-active": isPanelSelected,
                                })}
                              >
                                <span className="devtools-tab-line"></span>
                                <button
                                  id={`${panelId}-tab`}
                                  title={INSPECTOR_TAB_TITLES[panelId]}
                                  role="tab"
                                  onClick={() => dispatch(setActiveTab(panelId))}
                                >
                                  {INSPECTOR_TAB_TITLES[panelId]}
                                </button>
                              </span>
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
