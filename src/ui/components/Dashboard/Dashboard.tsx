import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import DashboardNavigation from "./Navigation/index";
const DashboardViewer = require("./DashboardViewer").default;
const Loader = require("../shared/Loader").default;
import { selectors } from "ui/reducers";

import { UIState } from "ui/state";
import hooks from "ui/hooks";
import "./Dashboard.css";
import { actions } from "ui/actions";
const { features } = require("ui/utils/prefs");

// Short term fix to allow us to toggle workspaces on and off with a flag.
function getRecordings(workspaceId: string) {
  if (features.workspaces) {
    const { recordings, loading } = hooks.useGetRecordings(workspaceId!);
    return { recordings, loading };
  } else {
    const { recordings, loading } = hooks.useGetMyRecordings();
    return { recordings, loading };
  }
}

function Dashboard({ currentWorkspaceId }: PropsFromRedux) {
  const [filter, setFilter] = useState("");
  const { recordings, loading } = getRecordings(currentWorkspaceId!);

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

const connector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  { setWorkspaceId: actions.setWorkspaceId }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Dashboard);
