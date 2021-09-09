import React from "react";
import { Route, Switch } from "react-router-dom";
import { useGetWorkspaceId } from "ui/utils/routes";
import Viewer from "./Viewer";
import hooks from "ui/hooks";
import Spinner from "../shared/Spinner";
import { PendingTeamScreen } from "./PendingTeamScreen";

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

  return <Viewer {...{ recordings, workspaceName: "My Library", searchString }} />;
}

function TeamLibrary(props: ViewerRouterProps) {
  const currentWorkspaceId = useGetWorkspaceId();
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  if (loading) {
    return <ViewerLoader />;
  }

  // If the user selects a pending team ID, we should handle is separetly to display an
  // accept/decline prompt instead of the usual library view.
  if (currentWorkspaceId && pendingWorkspaces?.map(w => w.id).includes(currentWorkspaceId)) {
    const workspace = pendingWorkspaces.find(w => w.id);
    return <PendingTeamScreen workspace={workspace!} />;
  } else {
    return <NonPendingTeamLibrary {...props} />;
  }
}

function NonPendingTeamLibrary({ searchString }: ViewerRouterProps) {
  const currentWorkspaceId = useGetWorkspaceId();
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

interface ViewerRouterProps {
  searchString: string;
}

export default function ViewerRouter(props: ViewerRouterProps) {
  return (
    <Switch>
      <Route path="/team/:workspaceId">
        <TeamLibrary {...props} />
      </Route>
      <Route>
        <MyLibrary {...props} />
      </Route>
    </Switch>
  );
}
