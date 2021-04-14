import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import useToken from "ui/utils/useToken";
import hooks from "../hooks";

const Header = require("./Header/index").default;
const SkeletonLoader = require("./SkeletonLoader").default;
const NonDevView = require("./Views/NonDevView").default;
const DevView = require("./Views/DevView").default;
const { prefs } = require("ui/utils/prefs");
import { isTest } from "ui/utils/environment";

import { actions } from "../actions";
import { selectors } from "../reducers";
import { UIState } from "ui/state";
import { UploadInfo } from "ui/state/app";
import { RecordingId } from "@recordreplay/protocol";

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
  setViewMode,
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
  const { title, deleted_at, user } = recording || {};

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

  useEffect(() => {
    const isAuthor = userId && userId == recording.user_id;

    // Force switch to viewer mode if the recording is being initialized
    // by the author.
    if (isAuthor && !recording.is_initialized && !isTest()) {
      setViewMode("non-dev");
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
    setViewMode: actions.setViewMode,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DevTools);
