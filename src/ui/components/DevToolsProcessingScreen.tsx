import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";

import { ReportProblemLink } from "replay-next/components/errors/ReportProblemLink";
import { SupportContextRoot } from "replay-next/components/errors/SupportContext";
import { useNotification } from "replay-next/src/hooks/useNotification";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getProcessingProgress } from "ui/reducers/app";
import { useAppSelector, useAppStore } from "ui/setup/hooks";
import { formatEstimatedProcessingDuration } from "ui/utils/formatEstimatedProcessingDuration";

import styles from "./DevToolsProcessingScreen.module.css";

const SHOW_STALLED_MESSAGE_AFTER_MS = 30_000;

export function DevToolsProcessingScreen() {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const store = useAppStore();

  const {
    permission: notificationPermission,
    requestPermission: requestNotificationPermission,
    requested: requestedNotificationPermission,
    supported: notificationSupported,
  } = useNotification();

  // Sync latest permission values to a ref so we they can be checked during an unmount
  const notificationPermissionStateRef = useRef({
    permission: notificationPermission,
    permissionRequested: requestedNotificationPermission,
  });
  useEffect(() => {
    const current = notificationPermissionStateRef.current;
    current.permission = notificationPermission;
    current.permissionRequested = requestedNotificationPermission;
  });

  const processingProgress = useAppSelector(getProcessingProgress);

  const [showStalledMessage, setShowStalledMessage] = useState(false);

  useEffect(() => {
    if (processingProgress == null) {
      const timeout = setTimeout(() => {
        setShowStalledMessage(true);
      }, SHOW_STALLED_MESSAGE_AFTER_MS);

      return () => {
        clearTimeout(timeout);
      };
    } else {
      setShowStalledMessage(false);
    }
  }, [processingProgress]);

  useEffect(() => {
    return () => {
      // We are intentionally referencing this mutable object in a cleanup effect
      // React warns that this may be a mistake (because the render and cleanup values may be different)
      // but in our case, we want the latest imperative value (which may cause this component to be unmounted)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const { permission, permissionRequested } = notificationPermissionStateRef.current;
      if (permissionRequested && permission === "granted" && recording) {
        const progress = getProcessingProgress(store.getState());
        if (progress === 100 && !document.hasFocus()) {
          new Notification(`"${recording.title}" has loaded`, {
            tag: recording.id,
          });
        }
      }
    };
  }, [recording, store]);

  let message = "Processing...";
  let secondaryMessage: ReactNode =
    "This could take a while, depending on the complexity and length of the replay.";

  if (showStalledMessage) {
    secondaryMessage = "There may be a problem. This is taking much longer than expected.";
  } else if (recording?.duration) {
    const durationLabel = formatEstimatedProcessingDuration(recording?.duration);
    secondaryMessage = `Based on the length of this Replay, we expect processing will take about ${durationLabel}`;
  }

  if (processingProgress != null) {
    message = `Processing... (${Math.round(processingProgress)}%)`;
  }

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        event.target.checked = false;
      }
    }
  };

  return (
    <LoadingScreen
      footer={
        <div className={styles.Footer}>
          <SupportContextRoot>
            <ReportProblemLink
              context={{
                id: "processing-screen",
              }}
              promptText="Please share information about what type of recording this is"
            />
          </SupportContextRoot>
          <div>if you think this is taking longer than it should.</div>
        </div>
      }
      message={
        <>
          <div className={styles.Message}>{message}</div>
          <div className={styles.SecondaryMessage}>{secondaryMessage}</div>
          {notificationSupported && (
            <label
              className={styles.NotifyMessage}
              data-disabled={notificationPermission === "denied" || undefined}
              title={
                notificationPermission === "denied"
                  ? "Notifications have been disabled in browser settings"
                  : undefined
              }
            >
              <input
                disabled={notificationPermission === "denied"}
                onChange={onChange}
                type="checkbox"
              />{" "}
              Notify me when this tab loads
            </label>
          )}
        </>
      }
    />
  );
}
