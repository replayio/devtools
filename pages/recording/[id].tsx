import React, { useEffect, useState } from "react";
import { connect, ConnectedProps, useStore } from "react-redux";
import { isTest } from "ui/utils/environment";
import { getAccessibleRecording } from "ui/actions/session";
import { Recording as RecordingInfo } from "ui/types";
import { useGetRecordingId } from "ui/hooks/recordings";
import { LoadingScreen } from "ui/components/shared/BlankScreen";
import { useRouter } from "next/router";
import Upload from "./upload";
import DevTools from "ui/components/DevTools";
import setup from "ui/setup/dynamic/devtools";

function Recording({ getAccessibleRecording }: PropsFromRedux) {
  const router = useRouter();
  const store = useStore();
  const recordingId = router.query.id;
  const [recording, setRecording] = useState<RecordingInfo | null>();
  const [uploadComplete, setUploadComplete] = useState(false);
  useEffect(() => {
    if (!store) return;

    async function getRecording() {
      await setup(store);
      setRecording(await getAccessibleRecording(recordingId));
    }
    getRecording();
  }, [store]);

  if (!recording || typeof window === "undefined") {
    return <LoadingScreen />;
  }

  // Add a check to make sure the recording has an associated user ID.
  // We skip the upload step if there's no associated user ID, which
  // is the case for CI test recordings.
  if (!uploadComplete && recording.isInitialized === false && !isTest() && recording.userId) {
    return <Upload onUpload={() => setUploadComplete(true)} />;
  } else {
    return <DevTools uploadComplete={uploadComplete} />;
  }
}

const connector = connect(null, { getAccessibleRecording });
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Recording);
