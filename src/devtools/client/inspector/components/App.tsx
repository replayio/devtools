import "ui/setup/dynamic/inspector";
import { useContext } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import ComputedApp from "devtools/client/inspector/computed/components/ComputedApp";
import LayoutApp from "devtools/client/inspector/layout/components/LayoutApp";
import MarkupApp from "devtools/client/inspector/markup/components/MarkupApp";
import { RulesApp } from "devtools/client/inspector/rules/components/RulesApp";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { isPointInRegions } from "shared/utils/time";
import { enterFocusMode } from "ui/actions/timeline";
import { getLoadedRegions } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { ResponsiveTabs, Tab } from "../../shared/components/ResponsiveTabs";
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

export default function InspectorApp() {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(state => state.inspector.activeTab);
  const { executionPoint } = useContext(TimelineContext);
  const loadedRegions = useAppSelector(getLoadedRegions);

  if (!isPointInRegions(executionPoint, loadedRegions?.loaded ?? [])) {
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
            <MarkupApp />
          </Panel>
          <PanelResizeHandle className="h-full w-1" />
          <Panel defaultSize={40} minSize={20}>
            <div className="devtools-inspector-tab-panel">
              <div id="inspector-sidebar-container">
                <div id="inspector-sidebar">
                  <div className="devtools-sidebar-tabs tabs">
                    <div>
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
                      <div>
                        <div className="tab-panel-box panels" role="tabpanel">
                          {activeTab === "computedview" && <ComputedApp />}
                          {activeTab === "eventsview" && <EventListenersApp />}
                          {activeTab === "layoutview" && (
                            <LayoutApp showBoxModelProperties={true} />
                          )}
                          {activeTab === "ruleview" && <RulesApp />}
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
