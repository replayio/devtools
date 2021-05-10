import React, { useState, useEffect, ReactElement } from "react";
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
import { ExpectedError, UploadInfo } from "ui/state/app";
import { RecordingId } from "@recordreplay/protocol";
import mixpanel from "mixpanel-browser";

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
  recordingTarget,
  setViewMode,
  setRecordingWorkspace,
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
  const { title } = recording || {};
  const { userId: cachedUserId } = hooks.useGetUserId();

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
    if (recording?.workspace) {
      setRecordingWorkspace(recording?.workspace);
    }
  }, [recording]);

  useEffect(() => {
    const isAuthor = cachedUserId && cachedUserId === recording?.userId;

    // Force switch to viewer mode if the recording is being initialized
    // by the author.
    if (isAuthor && !recording?.isInitialized && !isTest()) {
      setViewMode("non-dev");
    }
  }, [recording, cachedUserId]);

  let loaderResult: ReactElement | undefined;
  let expectedError: ExpectedError | undefined;

  if (queriesAreLoading) {
    loaderResult = <SkeletonLoader content={"Fetching the replay information."} />;
  } else if (recordingDuration === null) {
    loaderResult = <SkeletonLoader content={"Fetching the replay description."} />;
  } else if (uploading) {
    const message = getUploadingMessage(uploading);
    loaderResult = <SkeletonLoader content={message} />;
  }

  if (!loaderResult) {
    if (!isAuthorized) {
      if (userId) {
        expectedError = {
          message: "You don't have permission to view this replay.",
          content:
            "Sorry, you can't access this Replay. If you were given this URL, make sure you were invited.",
        };
      } else {
        expectedError = {
          message: "You need to sign in to view this replay.",
          action: "sign-in",
        };
      }
    }
  }

  useEffect(() => {
    if (expectedError) {
      setExpectedError(expectedError);
    }
  });
  if (loaderResult || expectedError) {
    return loaderResult || null;
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
      {(!prefs.video && viewMode == "dev") || recordingTarget == "node" ? (
        <DevView />
      ) : (
        <NonDevView />
      )}
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
    recordingTarget: selectors.getRecordingTarget(state),
  }),
  {
    updateTimelineDimensions: actions.updateTimelineDimensions,
    setExpectedError: actions.setExpectedError,
    setViewMode: actions.setViewMode,
    setRecordingWorkspace: actions.setRecordingWorkspace,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DevTools);
