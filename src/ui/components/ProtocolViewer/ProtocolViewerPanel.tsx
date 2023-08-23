import { unstable_Offscreen as Offscreen, Suspense, useContext, useState } from "react";

import Loader from "replay-next/components/Loader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ProtocolViewer } from "ui/components/ProtocolViewer/components/ProtocolViewer";
import { useIsRecordingOfReplay } from "ui/components/ProtocolViewer/hooks/useIsRecordingOfReplay";
import { recordedProtocolMessagesCache } from "ui/components/ProtocolViewer/suspense/recordedProtocolMessagesCache";
import {
  getProtocolErrorMap,
  getProtocolRequestMap,
  getProtocolResponseMap,
} from "ui/reducers/protocolMessages";
import { getAllSourceDetails } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./ProtocolViewerPanel.module.css";

export function ProtocolViewerPanel() {
  const [tab, setTab] = useState("live");

  const isRecordingOfReplay = useIsRecordingOfReplay();

  return (
    <div className={styles.Container}>
      {isRecordingOfReplay && (
        <div className={styles.Tabs}>
          <button
            className={styles.Tab}
            data-active={tab === "live" || undefined}
            onClick={() => setTab("live")}
          >
            Live
          </button>
          <button
            className={styles.Tab}
            data-active={tab === "recorded" || undefined}
            onClick={() => setTab("recorded")}
          >
            Recorded
          </button>
        </div>
      )}

      <div className={styles.Panel}>
        <Offscreen mode={tab === "live" ? "visible" : "hidden"}>
          <LiveProtocolRequests />
        </Offscreen>
        {isRecordingOfReplay && tab === "recorded" ? (
          <Suspense fallback={<Loader />}>
            <RecordedProtocolRequests />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}

export function LiveProtocolRequests() {
  const errorMap = useAppSelector(getProtocolErrorMap);
  const requestMap = useAppSelector(getProtocolRequestMap);
  const responseMap = useAppSelector(getProtocolResponseMap);

  return <ProtocolViewer errorMap={errorMap} requestMap={requestMap} responseMap={responseMap} />;
}

function RecordedProtocolRequests() {
  const replayClient = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);

  const sourceDetails = useAppSelector(getAllSourceDetails);

  const { errorMap, requestMap, responseMap } = focusRange
    ? recordedProtocolMessagesCache.read(replayClient, sourceDetails, {
        begin: focusRange.begin.point,
        end: focusRange.end.point,
      })
    : { errorMap: {}, requestMap: {}, responseMap: {} };

  return <ProtocolViewer errorMap={errorMap} requestMap={requestMap} responseMap={responseMap} />;
}
