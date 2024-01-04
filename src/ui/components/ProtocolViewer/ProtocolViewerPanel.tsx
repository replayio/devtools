import { unstable_Offscreen as Offscreen, Suspense, useContext, useMemo } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { useSources } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import useLocalStorageUserData from "shared/user-data/LocalStorage/useLocalStorageUserData";
import { ProtocolViewer } from "ui/components/ProtocolViewer/components/ProtocolViewer";
import { useIsRecordingOfReplay } from "ui/components/ProtocolViewer/hooks/useIsRecordingOfReplay";
import {
  RecordedProtocolData,
  recordedProtocolMessagesCache,
} from "ui/components/ProtocolViewer/suspense/recordedProtocolMessagesCache";
import {
  ProtocolErrorMap,
  ProtocolRequestMap,
  ProtocolResponseMap,
  getProtocolErrorMap,
  getProtocolRequestMap,
  getProtocolResponseMap,
} from "ui/reducers/protocolMessages";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./ProtocolViewerPanel.module.css";

export function ProtocolViewerPanel() {
  const [unsafeSelectedTab, selectTab] = useLocalStorageUserData("protocolViewerSelectedTab");

  const isRecordingOfReplay = useIsRecordingOfReplay();
  const safeSelectedTab = isRecordingOfReplay ? unsafeSelectedTab : "live";

  return (
    <div className={styles.Container}>
      {isRecordingOfReplay && (
        <div className={styles.Tabs}>
          <button
            className={styles.Tab}
            data-active={safeSelectedTab === "live" || undefined}
            onClick={() => selectTab("live")}
          >
            Live
          </button>
          <button
            className={styles.Tab}
            data-active={safeSelectedTab === "recorded" || undefined}
            onClick={() => selectTab("recorded")}
          >
            Recorded
          </button>
        </div>
      )}

      <div className={styles.Panel}>
        <Offscreen mode={safeSelectedTab === "live" ? "visible" : "hidden"}>
          <ErrorBoundary name="LiveProtocolRequests">
            <LiveProtocolRequests />
          </ErrorBoundary>
        </Offscreen>
        {isRecordingOfReplay && safeSelectedTab === "recorded" ? (
          <ErrorBoundary name="RecordedProtocolRequests">
            <Suspense fallback={<PanelLoader />}>
              <RecordedProtocolRequests />
            </Suspense>
          </ErrorBoundary>
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

const NO_MESSAGES: RecordedProtocolData[] = [];

function RecordedProtocolRequests() {
  const replayClient = useContext(ReplayClientContext);
  const { rangeForSuspense: focusRange } = useContext(FocusContext);

  const sourceDetails = useSources(replayClient);
  const sources = useAppSelector(state => state.sources);
  const sessionSource = sourceDetails?.find(source => source.url?.includes("ui/actions/session"));

  const allProtocolMessagesForRange =
    sessionSource && focusRange
      ? recordedProtocolMessagesCache.read(
          BigInt(focusRange.begin.point),
          BigInt(focusRange.end.point),
          replayClient,
          sessionSource,
          sources
        )
      : NO_MESSAGES;

  // The cache gave us the data as a flat array. Regroup it by request ID.
  const groupedMessageData = useMemo(() => {
    const errorMap: ProtocolErrorMap = {};
    const requestMap: ProtocolRequestMap = {};
    const responseMap: ProtocolResponseMap = {};

    for (const messageData of allProtocolMessagesForRange) {
      switch (messageData.type) {
        case "error": {
          errorMap[messageData.id] = messageData.value;
          break;
        }
        case "request": {
          requestMap[messageData.id] = messageData.value;
          break;
        }
        case "response": {
          responseMap[messageData.id] = messageData.value;
          break;
        }
      }
    }
    return { requestMap, responseMap, errorMap } as const;
  }, [allProtocolMessagesForRange]);

  if (!sessionSource) {
    return null;
  }

  const { requestMap, responseMap, errorMap } = groupedMessageData;

  return <ProtocolViewer errorMap={errorMap} requestMap={requestMap} responseMap={responseMap} />;
}
