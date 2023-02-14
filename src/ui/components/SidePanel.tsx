import React, { useEffect, useState } from "react";

import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import SecondaryPanes from "devtools/client/debugger/src/components/SecondaryPanes";
import Accordion from "devtools/client/debugger/src/components/shared/Accordion";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import Events from "ui/components/Events";
import { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import SearchFilesReduxAdapter from "ui/components/SearchFilesReduxAdapter";
import hooks from "ui/hooks";
import { useFeature } from "ui/hooks/settings";
import { Nag } from "ui/hooks/users";
import { useTestInfo } from "ui/hooks/useTestInfo";
import { getFlatEvents } from "ui/reducers/app";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import CommentCardsList from "./Comments/CommentCardsList";
import ReplayInfo from "./Events/ReplayInfo";
import ProtocolViewer from "./ProtocolViewer";
import StatusDropdown from "./shared/StatusDropdown";
import { TestSuitePanel } from "./TestSuitePanel";

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

  const viewMode = useAppSelector(getViewMode);
  const { nags } = hooks.useGetUserInfo();

  const showDevtoolsNag = shouldShowDevToolsNag(nags, viewMode);

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
    <div className="flex w-full flex-col gap-1">
      {shouldShowDevToolsNag(nags, viewMode) && (
        <div className="rounded-md bg-primaryAccent p-2">Welcome to Replay!</div>
      )}

      <div className="w-full overflow-hidden rounded-lg bg-bodyBgcolor text-xs">
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
