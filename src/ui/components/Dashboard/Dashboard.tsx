import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import DashboardNavigation from "./Navigation/index";
const DashboardViewer = require("./DashboardViewer").default;
const Loader = require("../shared/Loader").default;
import { selectors } from "ui/reducers";

import { UIState } from "ui/state";
import hooks from "ui/hooks";
import "./Dashboard.css";
import { getUserId } from "ui/utils/useToken";

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

function WorkspaceDashboard({ currentWorkspaceId }: PropsFromRedux) {
  const [filter, setFilter] = useState("");
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(currentWorkspaceId!);

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

function DashboardRouter(props: PropsFromRedux) {
  const { userSettings } = hooks.useGetUserSettings();

  if (!userSettings?.enable_teams) {
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
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DashboardRouter);
