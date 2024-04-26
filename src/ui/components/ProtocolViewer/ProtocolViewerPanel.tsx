import {
  unstable_Activity as Activity,
  Suspense,
  useContext,
  useLayoutEffect,
  useMemo,
} from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { useSources } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import useLocalStorageUserData from "shared/user-data/LocalStorage/useLocalStorageUserData";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
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
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import styles from "./ProtocolViewerPanel.module.css";

export function ProtocolViewerPanel() {
  const dispatch = useAppDispatch();

  const [showProtocolPanel] = useGraphQLUserData("feature_protocolPanel");

  const [unsafeSelectedTab, selectTab] = useLocalStorageUserData("protocolViewerSelectedTab");

  const isRecordingOfReplay = useIsRecordingOfReplay();
  const safeSelectedTab = isRecordingOfReplay ? unsafeSelectedTab : "live";

  useLayoutEffect(() => {
    if (!showProtocolPanel) {
      // If this panel was opened because of a URL parameter, and the user has opted out of this (advanced) feature,
      // then the panel will be blank and may confuse the user.
      // In that case, fall back to the "events" panel.
      dispatch(setSelectedPrimaryPanel("events"));
    }
  }, [dispatch, showProtocolPanel]);

  if (!showProtocolPanel) {
    return null;
  }

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
        <Activity mode={safeSelectedTab === "live" ? "visible" : "hidden"}>
          <InlineErrorBoundary name="LiveProtocolRequests">
            <LiveProtocolRequests />
          </InlineErrorBoundary>
        </Activity>
        {isRecordingOfReplay && safeSelectedTab === "recorded" ? (
          <InlineErrorBoundary name="RecordedProtocolRequests">
            <Suspense fallback={<PanelLoader />}>
              <RecordedProtocolRequests />
            </Suspense>
          </InlineErrorBoundary>
        ) : null}
      </div>
    </div>
  );
}

export function LiveProtocolRequests() {
  const errorMap = useAppSelector(getProtocolErrorMap);
  const requestMap = useAppSelector(getProtocolRequestMap);
  const responseMap = useAppSelector(getProtocolResponseMap);

  return (
    <ProtocolViewer
      errorMap={errorMap}
      requestMap={requestMap}
      responseMap={responseMap}
      scope="live"
    />
  );
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

  return (
    <ProtocolViewer
      errorMap={errorMap}
      requestMap={requestMap}
      responseMap={responseMap}
      scope="recorded"
    />
  );
}
