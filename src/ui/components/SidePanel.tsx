import React, { useEffect, useState } from "react";

import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import SecondaryPanes from "devtools/client/debugger/src/components/SecondaryPanes";
import Accordion from "devtools/client/debugger/src/components/shared/Accordion";
import LazyOffscreen from "replay-next/components/LazyOffscreen";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import { setViewMode } from "ui/actions/layout";
import Events from "ui/components/Events";
import { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import SearchFilesReduxAdapter from "ui/components/SearchFilesReduxAdapter";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { useFeature } from "ui/hooks/settings";
import { Nag } from "ui/hooks/users";
import { useTestInfo } from "ui/hooks/useTestInfo";
import { getFilteredEventsForFocusRegion } from "ui/reducers/app";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { ViewMode } from "ui/state/layout";
import { shouldShowTour } from "ui/utils/onboarding";
import useAuth0 from "ui/utils/useAuth0";

import Assist from "./Assist/Assist";
import CommentCardsList from "./Comments/CommentCardsList";
import ReplayInfo from "./Events/ReplayInfo";
import ProtocolViewer from "./ProtocolViewer";
import { ReactPanel } from "./ReactPanel";
import StatusDropdown from "./shared/StatusDropdown";
import { TestSuitePanel } from "./TestSuitePanel";
import Tour from "./Tour/Tour";
import styles from "src/ui/components/SidePanel.module.css";

function useInitialPrimaryPanel() {
  const dispatch = useAppDispatch();
  const selectedPrimaryPanel = useAppSelector(getSelectedPrimaryPanel);
  const info = useTestInfo();

  const { nags } = hooks.useGetUserInfo();
  const showTour = shouldShowTour(nags);
  const initialPrimaryPanel = info.isTestSuiteReplay ? "cypress" : showTour ? "tour" : "events";

  useEffect(() => {
    if (selectedPrimaryPanel == null) {
      dispatch(setSelectedPrimaryPanel(initialPrimaryPanel));
    }
  }, [dispatch, selectedPrimaryPanel, initialPrimaryPanel]);

  return selectedPrimaryPanel || initialPrimaryPanel;
}

export default function SidePanel() {
  const { value: resolveRecording } = useFeature("resolveRecording");
  const selectedPrimaryPanel = useInitialPrimaryPanel();
  const [replayInfoCollapsed, setReplayInfoCollapsed] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);
  const events = useAppSelector(getFilteredEventsForFocusRegion);
  const { isAuthenticated } = useAuth0();
  const viewMode = useAppSelector(getViewMode);
  const { nags } = hooks.useGetUserInfo();
  const showDevtoolsNag = shouldShowDevToolsNag(nags, viewMode);
  const dispatch = useAppDispatch();
  const dismissNag = hooks.useDismissNag();
  const handleToggle = async (mode: ViewMode) => {
    dispatch(setViewMode(mode));
    if (showDevtoolsNag) {
      dismissNag(Nag.VIEW_DEVTOOLS);
    }
  };

  const launchQuickstart = (url: string) => {
    window.open(url, "_blank");
  };
  const items: any[] = [];

  // if (recording?.metadata?.test?.tests?.length) {
  items.push({
    header: "Info",
    buttons: resolveRecording ? <StatusDropdown /> : null,
    className: "replay-info",
    component: <ReplayInfo />,
    opened: !replayInfoCollapsed,
    onToggle: () => setReplayInfoCollapsed(!replayInfoCollapsed),
  });

  if (events.length > 0) {
    items.push({
      header: "Events",
      buttons: null,
      className: "events-info flex-1 border-t overflow-hidden border-themeBorder",
      component: <Events />,
      opened: !eventsCollapsed,
      onToggle: () => setEventsCollapsed(!eventsCollapsed),
    });
  }

  const info = useTestInfo();

  return (
    <div className="flex w-full flex-col gap-2">
      {!isAuthenticated && !info.isTestSuiteReplay && (
        <div className={styles.TourBox}>
          <h2>Welcome to Replay!</h2>
          <p>Just getting started with time travel debugging? Check out our docs!</p>

          <button
            type="button"
            onClick={() => launchQuickstart("https://docs.replay.io/debugging")}
            style={{ padding: "4px 8px" }}
          >
            <div className="mr-1">Documentation</div>
            <MaterialIcon style={{ fontSize: "16px" }}>arrow_forward</MaterialIcon>
          </button>
        </div>
      )}

      {!isAuthenticated && info.isTestSuiteReplay && (
        <div className={styles.TourBox}>
          <h2>Welcome! 👋</h2>
          <p>We've written some docs to get the most out of Replay test suites. Check them out!</p>

          <button
            type="button"
            onClick={() =>
              launchQuickstart("https://docs.replay.io/recording-browser-tests-(beta)/test-replays")
            }
            style={{ padding: "4px 8px" }}
          >
            <div className="mr-1">Documentation</div>
            <MaterialIcon style={{ fontSize: "16px" }}>arrow_forward</MaterialIcon>
          </button>
        </div>
      )}

      <div className="h-0 w-full flex-grow overflow-hidden rounded-lg bg-bodyBgcolor text-xs">
        {selectedPrimaryPanel === "explorer" && <PrimaryPanes />}
        {selectedPrimaryPanel === "debugger" && <SecondaryPanes />}
        {selectedPrimaryPanel === "comments" && <CommentCardsList />}
        {selectedPrimaryPanel === "tour" && <Tour />}
        {selectedPrimaryPanel === "assist" && <Assist />}
        {selectedPrimaryPanel === "events" && <EventsPane items={items} />}
        {selectedPrimaryPanel === "cypress" && <TestSuitePanel />}
        {selectedPrimaryPanel === "protocol" && <ProtocolViewer />}
        {selectedPrimaryPanel === "search" && <SearchFilesReduxAdapter />}
        <LazyOffscreen mode={selectedPrimaryPanel === "react" ? "visible" : "hidden"}>
          <ReactPanel />
        </LazyOffscreen>
      </div>
    </div>
  );
}

function EventsPane({ items }: { items: any[] }) {
  return <Accordion items={items} />;
}
