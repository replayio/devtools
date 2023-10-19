import { useContext } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import ComputedApp from "devtools/client/inspector/computed/components/ComputedApp";
import LayoutApp from "devtools/client/inspector/layout/components/LayoutApp";
import { ElementsPanelAdapter } from "devtools/client/inspector/markup/components/ElementsPanelAdapter";
import MarkupApp from "devtools/client/inspector/markup/components/MarkupApp";
import { RulesPanel } from "devtools/client/inspector/markup/components/rules";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { useIsPointWithinFocusWindow } from "replay-next/src/hooks/useIsPointWithinFocusWindow";
import { ActiveInspectorTab } from "shared/user-data/GraphQL/config";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { enterFocusMode } from "ui/actions/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { ResponsiveTabs, Tab } from "../../shared/components/ResponsiveTabs";
import { setActiveTab } from "../actions";
import { EventListenersApp } from "../event-listeners/EventListenersApp";
import styles from "./App.module.css";

const INSPECTOR_TAB_TITLES: Record<ActiveInspectorTab, string> = {
  ruleview: "Rules",
  computedview: "Computed",
  layoutview: "Layout",
  eventsview: "Event Listeners",
} as const;

const availableTabs: readonly ActiveInspectorTab[] = [
  "ruleview",
  "layoutview",
  "computedview",
  "eventsview",
] as const;

export default function InspectorApp() {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(state => state.inspector.activeTab);
  const { executionPoint } = useContext(TimelineContext);

  const [enableNewElementsPanel] = useGraphQLUserData("feature_newElementsPanel");

  const isPointWithinFocusWindow = useIsPointWithinFocusWindow(executionPoint);
  if (!isPointWithinFocusWindow) {
    return (
      <div className="inspector-responsive-container bg-bodyBgcolor p-2">
        Elements are unavailable because you're paused at a point outside{" "}
        <span className="cursor-pointer underline" onClick={() => dispatch(enterFocusMode())}>
          your debugging window
        </span>
        .
      </div>
    );
  }

  return (
    <div className="inspector-responsive-container theme-body inspector">
      <div id="inspector-splitter-box">
        <PanelGroup autoSaveId="App" className="inspector-sidebar-splitter" direction="horizontal">
          <Panel minSize={20}>
            {enableNewElementsPanel ? <ElementsPanelAdapter /> : <MarkupApp />}
          </Panel>
          <PanelResizeHandle className={styles.ResizeHandle}>
            <div className={styles.ResizeHandleTarget} />
          </PanelResizeHandle>
          <Panel defaultSize={40} minSize={20}>
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
                        <ResponsiveTabs
                          activeIdx={availableTabs.indexOf(activeTab)}
                          dataTestId="InspectorTabs"
                        >
                          {availableTabs.map(panelId => {
                            const isPanelSelected = activeTab === panelId;
                            return (
                              <Tab
                                key={panelId}
                                id={panelId}
                                active={isPanelSelected}
                                text={INSPECTOR_TAB_TITLES[panelId]}
                                onClick={() => dispatch(setActiveTab(panelId))}
                              />
                            );
                          })}
                        </ResponsiveTabs>
                      </nav>
                      <div className="panels">
                        <div className="tab-panel-box" role="tabpanel">
                          {activeTab === "computedview" && <ComputedApp />}
                          {activeTab === "eventsview" && <EventListenersApp />}
                          {activeTab === "layoutview" && <LayoutApp />}
                          {activeTab === "ruleview" && <RulesPanel />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
