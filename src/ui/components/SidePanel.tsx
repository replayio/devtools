import React, { useEffect, useState } from "react";

import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import SecondaryPanes from "devtools/client/debugger/src/components/SecondaryPanes";
import Accordion from "devtools/client/debugger/src/components/shared/Accordion";
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
import { getFlatEvents } from "ui/reducers/app";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { ViewMode } from "ui/state/layout";
import useAuth0 from "ui/utils/useAuth0";
import CommentCardsList from "./Comments/CommentCardsList";
import ReplayInfo from "./Events/ReplayInfo";
import ProtocolViewer from "./ProtocolViewer";
import StatusDropdown from "./shared/StatusDropdown";
import { TestSuitePanel } from "./TestSuitePanel";
import styles from "src/ui/components/SidePanel.module.css";
import LoginButton from "ui/components/LoginButton";

function useInitialPrimaryPanel() {
  const dispatch = useAppDispatch();
  const selectedPrimaryPanel = useAppSelector(getSelectedPrimaryPanel);
  const info = useTestInfo();

  const initialPrimaryPanel = info.isTestSuiteReplay ? "cypress" : "events";

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
  const events = useAppSelector(getFlatEvents);
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
  
  const launchQuickstart = () => {
  window.open('https://docs.replay.io/recording-a-web-app/viewing-and-collaborating', '_blank');
  };
  
  const signIn = () => {
  console.log("signIn");
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

  
  return (
  <div className="flex w-full flex-col gap-2">
    {shouldShowDevToolsNag(nags, viewMode) && (
    <div className={styles.TourBox}>
      <h2>Welcome to Replay!</h2>
      <p>To get started, click into DevTools so we can show off some time travel features!</p>

      <button type="button" onClick={() => handleToggle("dev")} style={{ padding: "4px 8px" }}>
      <div className="mr-1">Open DevTools</div>

      <MaterialIcon style={{ fontSize: "16px" }}>arrow_forward</MaterialIcon>
      </button>
    </div>
    )}

    
    {!isAuthenticated && (
    <div className={styles.TourBox}>
      <h2>Welcome to Replay!</h2>
      <p>To get started with Replay, please sign in or read our quickstart guide.</p>
      
      <LoginButton variant="Tour" />
            
      <button type="button" onClick={() => launchQuickstart()} style={{ padding: "4px 8px" }}>
      <div className="mr-1">Quickstart guide</div>
      <MaterialIcon style={{ fontSize: "16px" }}>arrow_forward</MaterialIcon>
      </button>
    </div>
    )}
    


    <div className="h-0 flex-grow w-full overflow-hidden rounded-lg bg-bodyBgcolor text-xs">
    {selectedPrimaryPanel === "explorer" && <PrimaryPanes />}
    {selectedPrimaryPanel === "debugger" && <SecondaryPanes />}
    {selectedPrimaryPanel === "comments" && <CommentCardsList />}
    {selectedPrimaryPanel === "events" && <EventsPane items={items} />}
    {selectedPrimaryPanel === "cypress" && <TestSuitePanel />}
    {selectedPrimaryPanel === "protocol" && <ProtocolViewer />}
    {selectedPrimaryPanel === "search" && <SearchFilesReduxAdapter />}
    </div>
  </div>
  );
}

function EventsPane({ items }: { items: any[] }) {
  return <Accordion items={items} />;
}
