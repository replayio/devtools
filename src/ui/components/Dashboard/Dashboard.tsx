import React from "react";
import { connect, ConnectedProps } from "react-redux";
const DashboardViewer = require("./DashboardViewer").default;
const Loader = require("../shared/Loader").default;
import { selectors } from "ui/reducers";

import { UIState } from "ui/state";
import hooks from "ui/hooks";
import Invitations from "./Navigation/Invitations";
import "./Dashboard.css";

function PersonalDashboard() {
  const { recordings, loading } = hooks.useGetPersonalRecordings();
  const {
    workspaces: nonPendingWorkspaces,
    loading: nonPendingLoading,
  } = hooks.useGetNonPendingWorkspaces();

  if (loading || nonPendingLoading || recordings == null) {
    return <Loader />;
  }

  return <DashboardViewer recordings={recordings} showAssociationFilter={true} />;
}

function WorkspaceDashboard({ currentWorkspaceId }: PropsFromRedux) {
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(currentWorkspaceId!);
  const {
    workspaces: nonPendingWorkspaces,
    loading: nonPendingLoading,
  } = hooks.useGetNonPendingWorkspaces();

  if (loading || nonPendingLoading || recordings == null) {
    return <Loader />;
  }

  return <DashboardViewer recordings={recordings} showAssociationFilter={false} />;
}

function DashboardRouter(props: PropsFromRedux) {
  let dashboard;

  if (props.currentWorkspaceId == null) {
    dashboard = <PersonalDashboard />;
  } else {
    dashboard = <WorkspaceDashboard {...props} />;
  }

  return (
    <main className="dashboard">
      <Invitations />
      {dashboard}
    </main>
  );
}

const connector = connect((state: UIState) => ({
  currentWorkspaceId: selectors.getWorkspaceId(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DashboardRouter);
