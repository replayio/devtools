import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUploading } from "ui/reducers/app";
import { Recording } from "ui/types";
import { trackTiming } from "ui/utils/telemetry";

export function useTrackLoadingIdleTime(uploadComplete: boolean, recording?: Recording) {
  const uploading = useSelector(getUploading);
  const context = uploadComplete ? "warm" : "cold";
  const [started, setStarted] = useState(false);
  const [uploadProgressShown, setUploadProgressShown] = useState(false);

  useEffect(() => {
    if (recording && !started) {
      setStarted(true);
      trackTiming("kpi-loading-idle-time");
    }
  }, [recording, started, setStarted]);
  useEffect(() => {
    if (uploading) {
      setUploadProgressShown(true);
    }
  }, [uploading]);

  const trackLoadingIdleTime = (sessionId: string) => {
    trackTiming("kpi-loading-idle-time", { sessionId, context, uploadProgressShown });
  };

  return { trackLoadingIdleTime };
}
