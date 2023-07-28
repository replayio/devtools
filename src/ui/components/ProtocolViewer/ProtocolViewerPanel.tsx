import { useState } from "react";

import { LiveAppProtocolViewer } from "ui/components/ProtocolViewer/LiveAppProtocolViewer";
import { RecordedAppProtocolViewer } from "ui/components/ProtocolViewer/RecordedAppProtocolViewer";

import styles from "./ProtocolViewerPanel.module.css";

export function ProtocolViewerPanel() {
  const [tab, setTab] = useState("live");

  return (
    <div className={styles.Container}>
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

      <div className={styles.Panel}>
        <LiveAppProtocolViewer />
        <RecordedAppProtocolViewer />
      </div>
    </div>
  );
}
