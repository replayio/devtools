import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "../reducers";
import { UIState } from "ui/state";
import { createSession } from "ui/actions/session";
import { useGetRecordingId } from "ui/hooks/recordings";
import Header from "./Header/index";
import { LoadingScreen } from "./shared/BlankScreen";
import NonDevView from "./Views/NonDevView";
import WaitForReduxSlice from "./WaitForReduxSlice";

import "ui/setup/dynamic/devtools";

const DevView = React.lazy(() => import("./Views/DevView"));

function _DevTools({ loadingFinished, viewMode, createSession }: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  useEffect(() => {
    createSession(recordingId);
  }, [recordingId]);

  if (!loadingFinished) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Header />
      {viewMode == "dev" ? <DevView /> : <NonDevView />}
    </>
  );
}

const connector = connect(
  (state: UIState) => ({
    loadingFinished: selectors.getLoadingFinished(state),
    viewMode: selectors.getViewMode(state),
  }),
  {
    createSession,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
const ConnectedDevTools = connector(_DevTools);

const DevTools = () => (
  <WaitForReduxSlice slice="messages">
    <ConnectedDevTools />
  </WaitForReduxSlice>
);

export default DevTools;
