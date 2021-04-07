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

function Dashboard({ currentWorkspaceId }: PropsFromRedux) {
  const [filter, setFilter] = useState("");
  const { recordings, loading } = hooks.useGetRecordings(currentWorkspaceId!);

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

  return <Dashboard {...props} />;
}

const connector = connect((state: UIState) => ({
  currentWorkspaceId: selectors.getWorkspaceId(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DashboardRouter);
