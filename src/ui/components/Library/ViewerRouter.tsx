import React, { useEffect } from "react";
import Viewer from "./Viewer";

import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import Spinner from "../shared/Spinner";
import { PendingTeamScreen } from "./PendingTeamScreen";
import { MY_LIBRARY } from "../UploadScreen/Sharing";
import { actions } from "ui/actions";
import { BlankViewportWrapper } from "../shared/Viewport";
import Base64Image from "../shared/Base64Image";
import { sendTelemetryEvent } from "ui/utils/telemetry";

function ViewerLoader() {
  return (
    <div className="grid h-full w-full items-center justify-items-center bg-chrome">
      <Spinner className="text-themeBodyColor h-6 w-6 animate-spin" />
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

  const workspace = workspaces.find(ws => ws.id === currentWorkspaceId)!;

  return (
    <Viewer
      {...{
        recordings,
        workspaceName: workspace.logo ? (
          <Base64Image src={workspace.logo} className="max-h-12" />
        ) : (
          workspace.name
        ),
        searchString,
      }}
    />
  );
}

type ViewerRouterProps = PropsFromRedux & {
  searchString: string;
};

function ViewerRouter(props: ViewerRouterProps) {
  const { workspaces, loading: nonPendingLoading } = hooks.useGetNonPendingWorkspaces();
  const { id: userId, features, loading } = hooks.useGetUserInfo();
  const { currentWorkspaceId, setUnexpectedError, setWorkspaceId } = props;

  useEffect(() => {
    if (currentWorkspaceId === null && !features.library && !loading && !nonPendingLoading) {
      if (!workspaces.length) {
        // This shouldn't be reachable because the library can only be disabled
        // by a workspace setting which means the user must be in a workspace
        setUnexpectedError({
          message: "Unexpected error",
          content: "Unable to find an active team",
        });

        return;
      }

      setWorkspaceId(workspaces[0].id);
    }
  }, [
    currentWorkspaceId,
    loading,
    features,
    nonPendingLoading,
    setUnexpectedError,
    setWorkspaceId,
    workspaces,
  ]);

  if (loading) {
    return <BlankViewportWrapper />;
  }

  if (currentWorkspaceId === null && features.library) {
    return <MyLibrary {...props} />;
  } else if (currentWorkspaceId) {
    return <TeamLibrary {...props} />;
  }

  return null;
}

const connector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  { setWorkspaceId: actions.setWorkspaceId, setUnexpectedError: actions.setUnexpectedError }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ViewerRouter);
