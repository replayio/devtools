import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import DashboardNavigation from "./Navigation/index";
const DashboardViewer = require("./DashboardViewer").default;
const Loader = require("../shared/Loader").default;
import { selectors } from "ui/reducers";

import { UIState } from "ui/state";
import hooks from "ui/hooks";
import "./Dashboard.css";

function OldDashboard() {
  const [filter, setFilter] = useState("");
  const { recordings, loading } = hooks.useGetMyRecordings();

  if (loading || recordings == null) {
    return <Loader />;
  }

  const filteredRecordings = recordings.filter(recording => recording.url.includes(filter));

  return (
    <main className="dashboard">
      <DashboardNavigation recordings={recordings} setFilter={setFilter} filter={filter} />
      <DashboardViewer recordings={filteredRecordings} filter={filter} />
    </main>
  );
}

function PersonalDashboard() {
  const [filter, setFilter] = useState("");
  const { recordings, loading } = hooks.useGetPersonalRecordings();
  const { loading: nonPendingLoading } = hooks.useGetNonPendingWorkspaces();

  if (loading || nonPendingLoading || recordings == null) {
    return <Loader />;
  }

  return (
    <main className="dashboard">
      <DashboardViewer recordings={recordings} filter={filter} />
    </main>
  );
}

function WorkspaceDashboard({ currentWorkspaceId }: PropsFromRedux) {
  const [filter, setFilter] = useState("");
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(currentWorkspaceId!);
  const { loading: nonPendingLoading } = hooks.useGetNonPendingWorkspaces();

  if (loading || nonPendingLoading || recordings == null) {
    return <Loader />;
  }

  const filteredRecordings = recordings.filter(recording => recording.url.includes(filter));

  return (
    <main className="dashboard">
      <DashboardViewer recordings={filteredRecordings} filter={filter} />
    </main>
  );
}

function DashboardRouter(props: PropsFromRedux) {
  const { userSettings } = props;

  if (!userSettings.enableTeams) {
    return <OldDashboard />;
  }

  if (props.currentWorkspaceId == null) {
    return <PersonalDashboard />;
  } else {
    return <WorkspaceDashboard {...props} />;
  }
}

const connector = connect((state: UIState) => ({
  currentWorkspaceId: selectors.getWorkspaceId(state),
  userSettings: selectors.getUserSettings(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DashboardRouter);
