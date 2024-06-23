import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";

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
    permissionsRequested: requestedNotificationPermission,
  });
  useEffect(() => {
    const current = notificationPermissionStateRef.current;
    current.permission = notificationPermission;
    current.permissionsRequested = requestedNotificationPermission;
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const { permission, permissionsRequested } = notificationPermissionStateRef.current;
      if (permissionsRequested && permission === "granted" && recording) {
        const progress = getProcessingProgress(store.getState());
        if (progress === 100) {
          new Notification(`"${recording.title}" has loaded`);
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
        event.target.blur();
      }
    }
  };

  return (
    <LoadingScreen
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
                className={styles.Checkbox}
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
