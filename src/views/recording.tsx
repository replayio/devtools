import React, { useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { isTest } from "ui/utils/environment";
import { getAccessibleRecording } from "ui/actions/session";
import { Recording as RecordingInfo } from "ui/types";
import { useGetRecordingId } from "ui/hooks/recordings";
import { LoadingScreen } from "ui/components/shared/BlankScreen";
import Upload from "views/upload";
import DevTools from "ui/components/DevTools";

function Recording({ getAccessibleRecording }: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  const [recording, setRecording] = useState<RecordingInfo | null>();
  useEffect(() => {
    async function getRecording() {
      setRecording(await getAccessibleRecording(recordingId));
    }
    getRecording();
  }, []);

  if (!recording) {
    return <LoadingScreen />;
  }

  // Add a check to make sure the recording has an associated user ID.
  // We skip the upload step if there's no associated user ID, which
  // is the case for CI test recordings.
  if (recording.isInitialized === false && !isTest() && recording.userId) {
    return <Upload />;
  } else {
    return <DevTools />;
  }
}

const connector = connect(null, { getAccessibleRecording });
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Recording);
