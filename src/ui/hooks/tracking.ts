import { useEffect, useState } from "react";

import { Recording } from "shared/graphql/types";
import { getUploading } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { trackTiming } from "ui/utils/telemetry";

export function useTrackLoadingIdleTime(uploadComplete: boolean, recording?: Recording) {
  const uploading = useAppSelector(getUploading);
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
