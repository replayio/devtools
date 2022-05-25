import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUploading } from "ui/reducers/app";
import { Recording } from "ui/types";
import { trackTiming } from "ui/utils/telemetry";

type LoadingContext = "warm" | "cold";

export function useTrackLoadingIdleTime(context: LoadingContext, recording?: Recording) {
  const uploading = useSelector(getUploading);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (recording && !uploading && !started) {
      setStarted(true);
      trackTiming("kpi-loading-idle-time");
    }
  }, [recording, started, setStarted, uploading]);

  const trackLoadingIdleTime = (sessionId: string) => {
    trackTiming("kpi-loading-idle-time", { sessionId, context });
  };

  return { trackLoadingIdleTime };
}
