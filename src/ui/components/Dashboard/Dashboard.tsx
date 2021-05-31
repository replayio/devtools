import React from "react";
import { connect, ConnectedProps } from "react-redux";
const DashboardViewer = require("./DashboardViewer").default;
const Loader = require("../shared/Loader").default;
import * as selectors from "ui/reducers/app";

import { UIState } from "ui/state";
import hooks from "ui/hooks";
import Invitations from "./Navigation/Invitations";
import "./Dashboard.css";

function PersonalDashboard() {
  const { recordings, loading } = hooks.useGetPersonalRecordings();
  const { loading: nonPendingLoading } = hooks.useGetNonPendingWorkspaces();

  if (loading || nonPendingLoading || recordings == null) {
    return <Loader />;
  }

  return <DashboardViewer recordings={recordings} />;
}

function WorkspaceDashboard({ currentWorkspaceId }: PropsFromRedux) {
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(currentWorkspaceId!);
  const { loading: nonPendingLoading } = hooks.useGetNonPendingWorkspaces();

  if (loading || nonPendingLoading || recordings == null) {
    return <Loader />;
  }

  return <DashboardViewer recordings={recordings} />;
}

function DashboardRouter(props: PropsFromRedux) {
  return (
    <main className="dashboard">
      <Invitations />
      {props.currentWorkspaceId === null ? (
        <PersonalDashboard />
      ) : (
        <WorkspaceDashboard {...props} />
      )}
    </main>
  );
}

const connector = connect((state: UIState) => ({
  currentWorkspaceId: selectors.getWorkspaceId(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DashboardRouter);
