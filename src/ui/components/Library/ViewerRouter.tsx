import React from "react";
import Loader from "../shared/Loader";
import Viewer from "./Viewer";

import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import Spinner from "../shared/Spinner";

function ViewerLoader() {
  return (
    <div className="bg-gray-100 w-full h-full grid items-center justify-items-center">
      <Spinner className="animate-spin h-6 w-6 text-black" />
    </div>
  );
}

function MyLibrary({ workspaceName, searchString }: ViewerRouterProps) {
  const { recordings, loading } = hooks.useGetPersonalRecordings();
  const { loading: nonPendingLoading } = hooks.useGetNonPendingWorkspaces();

  if (loading || nonPendingLoading || recordings == null) {
    return <ViewerLoader />;
  }

  return <Viewer {...{ recordings, workspaceName, searchString }} />;
}

function TeamLibrary({ currentWorkspaceId, workspaceName, searchString }: ViewerRouterProps) {
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(currentWorkspaceId!);
  const { loading: nonPendingLoading } = hooks.useGetNonPendingWorkspaces();

  if (loading || nonPendingLoading || recordings == null) {
    return <ViewerLoader />;
  }

  return <Viewer {...{ recordings, workspaceName, searchString }} />;
}

type ViewerRouterProps = PropsFromRedux & {
  workspaceName: string;
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
