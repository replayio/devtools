import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import useToken from "ui/utils/useToken";
import hooks from "../hooks";

const Header = require("./Header/index").default;
const SkeletonLoader = require("./SkeletonLoader").default;
const NonDevView = require("./Views/NonDevView").default;
const DevView = require("./Views/DevView").default;
const { prefs } = require("ui/utils/prefs");
import DraftScreen from "./DraftScreen";

import { actions } from "../actions";
import { selectors } from "../reducers";
import { UIState } from "ui/state";
import { UploadInfo } from "ui/state/app";
import { RecordingId } from "@recordreplay/protocol";

function isTest() {
  return new URL(window.location.href).searchParams.get("test");
}

type DevToolsProps = PropsFromRedux & {
  recordingId: RecordingId;
};

function getUploadingMessage(uploading: UploadInfo) {
  if (!uploading) {
    return "";
  }

  const { total, amount } = uploading;
  if (total) {
    return `Waiting for upload… ${amount} / ${total} MB`;
  }

  return `Waiting for upload… ${amount} MB`;
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
}: DevToolsProps) {
  const [finishedLoading, setFinishedLoading] = useState(false);
  const { claims } = useToken();
  const userId = claims?.hasura.userId;

  const AddSessionUser = hooks.useAddSessionUser();
  const { recording, isAuthorized, loading: recordingQueryLoading } = hooks.useGetRecording(
    recordingId
  );
  const { loading: settingsQueryLoading } = hooks.useGetUserSettings();
  const queriesAreLoading = recordingQueryLoading || settingsQueryLoading;
  const { title, deleted_at, is_initialized, user_id, user } = recording || {};

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
    if (loading == 100 && userId && sessionId) {
      AddSessionUser({ variables: { id: sessionId, user_id: userId } });
    }
  }, [loading, userId, sessionId]);

  useEffect(() => {
    if (title) {
      document.title = `${title} - Replay`;
    }
  }, [recording]);

  if (queriesAreLoading || !recording) {
    return <SkeletonLoader content={"Fetching the replay information."} />;
  } else if (recordingDuration === null) {
    return <SkeletonLoader content={"Fetching the replay description."} />;
  } else if (uploading) {
    const message = getUploadingMessage(uploading);
    return <SkeletonLoader content={message} />;
  }

  if (deleted_at) {
    setExpectedError({ message: "This replay has been deleted." });
    return null;
  }

  // Test recordings don't have a user, so we skip this check in that case.
  if (user && user.invited == false) {
    setExpectedError({ message: "The author of this Replay has not activated their account yet." });
    return null;
  }

  if (!isAuthorized) {
    if (userId) {
      setExpectedError({ message: "You don't have permission to view this replay." });
    } else {
      setExpectedError({
        message: "You need to sign in to view this replay.",
        action: "sign-in",
      });
    }
    return null;
  }

  // Only show the initialization screen if the replay is not being opened
  // for testing purposes.
  if (!is_initialized && !isTest()) {
    if (user_id == userId) {
      return <DraftScreen />;
    } else {
      setExpectedError({ message: "This replay is being uploaded, try again in a moment" });
    }
  }

  if (!finishedLoading) {
    return (
      <SkeletonLoader
        setFinishedLoading={setFinishedLoading}
        progress={loading}
        content={"Scanning the recording..."}
      />
    );
  }

  return (
    <>
      <Header />
      {!prefs.video && viewMode == "dev" ? <DevView /> : <NonDevView />}
    </>
  );
}

const connector = connect(
  (state: UIState) => ({
    loading: selectors.getLoading(state),
    uploading: selectors.getUploading(state),
    recordingDuration: selectors.getRecordingDuration(state),
    sessionId: selectors.getSessionId(state),
    selectedPanel: selectors.getSelectedPanel(state),
    viewMode: selectors.getViewMode(state),
    narrowMode: selectors.getNarrowMode(state),
  }),
  {
    updateTimelineDimensions: actions.updateTimelineDimensions,
    setExpectedError: actions.setExpectedError,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DevTools);
