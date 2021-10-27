import React from "react";
import Viewer from "./Viewer";

import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import Spinner from "../shared/Spinner";
import { PendingTeamScreen } from "./PendingTeamScreen";
import { MY_LIBRARY } from "../UploadScreen/Sharing";

function ViewerLoader() {
  return (
    <div className="bg-gray-100 w-full h-full grid items-center justify-items-center">
      <Spinner className="animate-spin h-6 w-6 text-black" />
    </div>
  );
}

function MyLibrary({ searchString }: ViewerRouterProps) {
  const { recordings, loading } = hooks.useGetPersonalRecordings();
  const { loading: nonPendingLoading } = hooks.useGetNonPendingWorkspaces();

  if (loading || nonPendingLoading || recordings == null) {
    return <ViewerLoader />;
  }

  return <Viewer {...{ recordings, workspaceName: MY_LIBRARY, searchString }} />;
}

function TeamLibrary(props: ViewerRouterProps) {
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();
  const { currentWorkspaceId } = props;

  if (loading) {
    return <ViewerLoader />;
  }

  // If the user selects a pending team ID, we should handle is separetly to display an
  // accept/decline prompt instead of the usual library view.
  if (currentWorkspaceId && pendingWorkspaces?.map(w => w.id).includes(currentWorkspaceId)) {
    const workspace = pendingWorkspaces.find(w => w.id === currentWorkspaceId);
    return <PendingTeamScreen workspace={workspace!} />;
  } else {
    return <NonPendingTeamLibrary {...props} />;
  }
}

function NonPendingTeamLibrary({ currentWorkspaceId, searchString }: ViewerRouterProps) {
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(currentWorkspaceId!);
  const { workspaces, loading: nonPendingLoading } = hooks.useGetNonPendingWorkspaces();

  if (loading || nonPendingLoading || recordings == null) {
    return <ViewerLoader />;
  }

  return (
    <Viewer
      {...{
        recordings,
        workspaceName: workspaces.find(ws => ws.id === currentWorkspaceId)!.name,
        searchString,
      }}
    />
  );
}

type ViewerRouterProps = PropsFromRedux & {
  searchString: string;
};

function ViewerRouter(props: ViewerRouterProps) {
  const { currentWorkspaceId } = props;

  if (currentWorkspaceId === null) {
    return <MyLibrary {...props} />;
  } else {
    return <TeamLibrary {...props} />;
  }
}

const connector = connect((state: UIState) => ({
  currentWorkspaceId: selectors.getWorkspaceId(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ViewerRouter);
