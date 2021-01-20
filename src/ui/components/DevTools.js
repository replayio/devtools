import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

import Header from "./Header/index";
import SkeletonLoader from "./SkeletonLoader";
import NonDevView from "./Views/NonDevView";
import DevView from "./Views/DevView";
import hooks from "../hooks";

import { actions } from "../actions";
import { selectors } from "../reducers";

function getUploadingMessage(uploading) {
  if (!uploading) {
    return "";
  }

  const { total, amount } = uploading;
  if (total) {
    return `Waiting for upload… ${amount} / ${total} MB`;
  }

  return `Waiting for upload… ${amount} MB`;
}

function getIsAuthorized({ data }) {
  const test = new URL(window.location.href).searchParams.get("test");

  // Ideally, test recordings should be inserted into Hasura. However, test recordings are currently
  // not being inserted as a Hasura recordings row, so the GET_RECORDING query will respond with an
  // empty recordings array. To temporarily work around this for now, we return `true` here so
  // the test can proceed.
  if (test) {
    return true;
  }

  // We let Hasura decide whether or not the user can view a recording. The response to our query
  // will have a recording if they're authorized to view the recording, and will be empty if not.
  return data.recordings.length;
}

function DevTools({
  loading,
  uploading,
  recordingDuration,
  recordingId,
  setExpectedError,
  selectedPanel,
  sessionId,
  viewMode,
}) {
  const [finishedLoading, setFinishedLoading] = useState(false);
  const auth = useAuth0();
  const AddSessionUser = hooks.useAddSessionUser();
  const { data, queryIsLoading } = hooks.useGetRecording(recordingId);

  useEffect(() => {
    // This shouldn't hit when the selectedPanel is "comments"
    // as that's not dealt with in toolbox, however we still
    // need to init the toolbox so we're not checking for
    // that in the if statement here.
    if (loading == 100) {
      gToolbox.init(selectedPanel);
    }
  }, [loading]);

  useEffect(() => {
    if (loading == 100 && auth.user && sessionId) {
      hooks.fetchUserId(auth.user.sub).then(userId => {
        AddSessionUser({ variables: { id: sessionId, user_id: userId } });
      });
    }
  }, [loading, auth.user, sessionId]);

  if (queryIsLoading) {
    return <SkeletonLoader content={"Fetching the recording information"} />;
  } else if (recordingDuration === null) {
    return <SkeletonLoader content={"Fetching the recording description"} />;
  } else if (uploading) {
    const message = getUploadingMessage(uploading);
    return <SkeletonLoader content={message} />;
  }

  const isAuthorized = getIsAuthorized({ data });

  if (!isAuthorized) {
    if (auth.isAuthenticated) {
      setExpectedError({ message: "You don't have permission to view this recording." });
    } else {
      setExpectedError({
        message: "You need to sign in to view this recording.",
        action: "sign-in",
      });
    }
    return null;
  }

  if (!finishedLoading) {
    return (
      <SkeletonLoader
        setFinishedLoading={setFinishedLoading}
        progress={loading}
        content={"Scanning the recording"}
      />
    );
  }

  return (
    <>
      <Header />
      {viewMode == "dev" ? <DevView /> : <NonDevView />}
    </>
  );
}

export default connect(
  state => ({
    loading: selectors.getLoading(state),
    uploading: selectors.getUploading(state),
    recordingDuration: selectors.getRecordingDuration(state),
    sessionId: selectors.getSessionId(state),
    recordingId: selectors.getRecordingId(state),
    selectedPanel: selectors.getSelectedPanel(state),
    viewMode: selectors.getViewMode(state),
    narrowMode: selectors.getNarrowMode(state),
  }),
  {
    updateTimelineDimensions: actions.updateTimelineDimensions,
    setExpectedError: actions.setExpectedError,
  }
)(DevTools);
