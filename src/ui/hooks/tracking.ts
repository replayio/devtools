import { useEffect, useState } from "react";
import { Recording } from "ui/types";
import { trackTiming } from "ui/utils/telemetry";

type LoadingContext = "warm" | "cold";

export function useTrackLoadingIdleTime(context: LoadingContext, recording?: Recording) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (recording && !started) {
      setStarted(true);
      trackTiming("kpi-loading-idle-time");
    }
  }, [recording, started, setStarted]);

  const trackLoadingIdleTime = (sessionId: string) => {
    trackTiming("kpi-loading-idle-time", { sessionId, context });
  };

  return { trackLoadingIdleTime };
}
