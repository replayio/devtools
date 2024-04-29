import { Suspense, useContext, useEffect, useMemo, useRef, useState } from "react";

import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import SecondaryPanes from "devtools/client/debugger/src/components/SecondaryPanes";
import Accordion from "devtools/client/debugger/src/components/shared/Accordion";
import { RecordedEventsCache } from "protocol/RecordedEventsCache";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import Events from "ui/components/Events";
import SearchFilesReduxAdapter from "ui/components/SearchFilesReduxAdapter";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import TestSuitePanel from "ui/components/TestSuite";
import { isTestSuiteReplay } from "ui/components/TestSuite/utils/isTestSuiteReplay";
import hooks from "ui/hooks";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getAccessToken } from "ui/reducers/app";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { PrimaryPanelName } from "ui/state/layout";
import { shouldShowTour } from "ui/utils/onboarding";

import CommentCardsList from "./Comments/CommentCardsList";
import EventsDropDownMenu from "./Events/EventsDropDownMenu";
import ReplayInfo from "./Events/ReplayInfo";
import Passport from "./Passport/Passport";
import ProtocolViewer from "./ProtocolViewer";
import Tour from "./Tour/Tour";
import styles from "src/ui/components/SidePanel.module.css";

function useInitialPrimaryPanel() {
  const dispatch = useAppDispatch();
  const selectedPrimaryPanel = useAppSelector(getSelectedPrimaryPanel);
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const { nags } = hooks.useGetUserInfo();
  const showTour = shouldShowTour(nags);
  const isAuthenticated = !!useAppSelector(getAccessToken);

  const { comments } = hooks.useGetComments(recordingId);

  let initialPrimaryPanel: PrimaryPanelName;
  if (recording && isTestSuiteReplay(recording)) {
    initialPrimaryPanel = "cypress";
  } else if (showTour) {
    initialPrimaryPanel = "tour";
  } else if (!isAuthenticated && comments.length > 0) {
    initialPrimaryPanel = "comments";
  } else {
    initialPrimaryPanel = "events";
  }

  useEffect(() => {
    if (selectedPrimaryPanel == null) {
      dispatch(setSelectedPrimaryPanel(initialPrimaryPanel));
    }
  }, [dispatch, selectedPrimaryPanel, initialPrimaryPanel]);

  return selectedPrimaryPanel || initialPrimaryPanel;
}

export default function SidePanel() {
  return (
    <Suspense fallback={<PanelLoader />}>
      <SidePanelSuspends />
    </Suspense>
  );
}

function SidePanelSuspends() {
  const { range: focusWindow } = useContext(FocusContext);
  const selectedPrimaryPanel = useInitialPrimaryPanel();
  const [replayInfoCollapsed, setReplayInfoCollapsed] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);
  const isAuthenticated = !!useAppSelector(getAccessToken);

  const events = RecordedEventsCache.read();

  const hasEventsInFocusWindow = useMemo(
    () =>
      events.some(
        event =>
          !focusWindow ||
          isExecutionPointsWithinRange(event.point, focusWindow.begin.point, focusWindow.end.point)
      ),
    [events, focusWindow]
  );

  const launchQuickstart = (url: string) => {
    window.open(url, "_blank");
  };
  const items: any[] = [];

  items.push({
    header: "Info",
    buttons: null,
    className: "replay-info",
    component: <ReplayInfo />,
    opened: !replayInfoCollapsed,
    onToggle: () => setReplayInfoCollapsed(!replayInfoCollapsed),
  });

  if (hasEventsInFocusWindow) {
    items.push({
      header: (
        <div className={styles.EventsHeader}>
          Events
          <EventsDropDownMenu events={events} />
        </div>
      ),
      buttons: null,
      className: "events-info flex-1 border-t overflow-hidden border-themeBorder",
      component: <Events events={events} />,
      opened: !eventsCollapsed,
      onToggle: () => setEventsCollapsed(!eventsCollapsed),
    });
  }

  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const testSuite = recording && isTestSuiteReplay(recording);

  const { comments, loading } = hooks.useGetComments(recordingId);

  const [isNGXHeaderVisible, setIsNGXHeaderVisible] = useState(
    localStorage.getItem("NGXHeaderVisibility") !== "hidden"
  );

  const initialPanelRef = useRef(selectedPrimaryPanel);

  useEffect(() => {
    if (selectedPrimaryPanel !== initialPanelRef.current) {
      setIsNGXHeaderVisible(false);
      localStorage.setItem("NGXHeaderVisibility", "hidden");
    }
  }, [selectedPrimaryPanel]);

  return (
    <div className="flex w-full flex-col gap-2">
      {!isAuthenticated && !testSuite && isNGXHeaderVisible && (
        <div className={styles.TourBox}>
          <h2>Welcome to Replay!</h2>
          {comments.length > 0 ? (
            <p>Check out the comments below to get started:</p>
          ) : (
            <>
              <p>Just getting started with time travel debugging? Check out our docs!</p>
              <button
                type="button"
                onClick={() => launchQuickstart("https://docs.replay.io/debugging")}
                style={{ padding: "4px 8px" }}
              >
                <div className="mr-1">Documentation</div>
                <MaterialIcon style={{ fontSize: "16px" }}>arrow_forward</MaterialIcon>
              </button>
            </>
          )}
        </div>
      )}
      {!isAuthenticated && testSuite && isNGXHeaderVisible && (
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
        {selectedPrimaryPanel === "passport" && <Passport />}
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
