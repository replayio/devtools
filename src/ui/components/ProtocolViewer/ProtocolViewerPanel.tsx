import { useState, useTransition } from "react";

import { useIsRecordingOfReplay } from "ui/components/ProtocolViewer/hooks/useIsRecordingOfReplay";
import { LiveProtocolRequests } from "ui/components/ProtocolViewer/LiveProtocolRequests";
import { RecordedProtocolRequests } from "ui/components/ProtocolViewer/RecordedProtocolRequests";

import styles from "./ProtocolViewerPanel.module.css";

export function ProtocolViewerPanel() {
  const [tab, setTab] = useState("live");

  const [isPending, startTransition] = useTransition();

  const isRecordingOfReplay = useIsRecordingOfReplay();

  const showLiveTab = () => setTab("live");

  const showRecordedTab = () => {
    // This tab might suspend
    startTransition(() => setTab("recorded"));
  };

  return (
    <div className={styles.Container}>
      {isRecordingOfReplay && (
        <div className={styles.Tabs}>
          <button
            className={styles.Tab}
            disabled={isPending}
            data-active={tab === "live" || undefined}
            onClick={showLiveTab}
          >
            Live
          </button>
          <button
            className={styles.Tab}
            disabled={isPending}
            data-active={tab === "recorded" || undefined}
            onClick={showRecordedTab}
          >
            Recorded
          </button>
        </div>
      )}

      <div className={styles.Panel}>
        {tab === "live" ? <LiveProtocolRequests /> : <RecordedProtocolRequests />}
      </div>
    </div>
  );
}
