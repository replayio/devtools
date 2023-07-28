import { ReactNode, useState } from "react";

import { CommandResponse } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { JSONViewer } from "ui/components/ProtocolViewer/components/JSONViewer";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserInfo } from "ui/hooks/users";
import { Recorded, RequestSummary } from "ui/reducers/protocolMessages";
import { formatDuration, formatTimestamp } from "ui/utils/time";

import styles from "./ProtocolRequestDetail.module.css";

const BACKEND_GITHUB_REPO_BASE_URL = "https://github.com/recordReplay/backend/";

export function ProtocolRequestDetail({
  error,
  index,
  request,
  response,
}: {
  error: (CommandResponse & Recorded) | undefined;
  index: number;
  request: RequestSummary;
  response: (CommandResponse & Recorded) | undefined;
}) {
  const { internal: isInternalUser } = useGetUserInfo();
  const recordingId = useGetRecordingId();

  let className = "";
  if (error != null) {
    className = styles.ColorErrored;
  } else if (response == null) {
    className = styles.ColorPending;
  }

  let reportBugLink = null;
  let honeycombQueryLink = null;
  // If this command failed, or is hung, we might want to report it to the backend team.
  if (isInternalUser) {
    if (error != null || response == null) {
      const title = `${request.method} failure`;
      const body = [
        `Recording ID: ${recordingId}`,
        `Session ID: ${ThreadFront.sessionId}`,
        `Command ID: ${request.id}`,
      ].join("\n");

      reportBugLink = `${BACKEND_GITHUB_REPO_BASE_URL}/issues/new?body=${encodeURIComponent(
        body
      )}&title=${encodeURIComponent(title)}&labels=bug,bug-report`;

      const qs = encodeURIComponent(
        JSON.stringify({
          time_range: 3600,
          granularity: 0,
          breakdowns: ["trace.trace_id"],
          calculations: [{ op: "COUNT" }],
          filters: [
            { column: "name", op: "starts-with", value: "replayprotocol" },
            { column: "replay.session.id", op: "=", value: window.sessionId },
            { column: "rpc.replayprotocol.command_id", op: "=", value: request.id },
          ],
          filter_combination: "AND",
          orders: [{ op: "COUNT", order: "descending" }],
          havings: [],
          limit: 100,
        })
      );
      honeycombQueryLink = `https://ui.honeycomb.io/replay/datasets/backend?query=${qs}`;
    }
  }

  return (
    <ProtocolRequestDetailPanel
      autoExpand={index === 0}
      header={
        <>
          <span className={styles.DetailPanelHeaderPrimary}>
            <span className={className}>{request.method}</span>
            {reportBugLink != null && (
              <a
                className={styles.BugReportLink}
                href={reportBugLink}
                rel="noreferrer noopener"
                target="_blank"
                title="Report protocol bug"
              >
                <MaterialIcon>bug_report</MaterialIcon>
              </a>
            )}
            {honeycombQueryLink != null && (
              <a
                className={styles.HoneycombLink}
                href={honeycombQueryLink}
                rel="noreferrer noopener"
                target="_blank"
                title="View in Honeycomb"
              >
                <MaterialIcon>hive</MaterialIcon>
              </a>
            )}
          </span>
          <small className={styles.DetailPanelHeaderSecondary}>
            {response ? `(${formatDuration(response.recordedAt - request.recordedAt)}) ` : ""}
            {formatTimestamp(request.recordedAt)}
          </small>
        </>
      }
    >
      <div className={styles.DetailPanel}>
        <h3 className={styles.DetailPanelHeader}>Request</h3>
        <div className={styles.JSONViewerContainer}>
          <JSONViewer src={request} />
        </div>
        {response != null && (
          <>
            <h3 className={styles.DetailPanelHeader}>Response</h3>
            <div className={styles.JSONViewerContainer}>
              <JSONViewer src={response} />
            </div>
          </>
        )}
        {error != null && (
          <>
            <h3 className={styles.DetailPanelHeader}>Error</h3>
            <div className={styles.JSONViewerContainer}>
              <JSONViewer src={error} />
            </div>
          </>
        )}
      </div>
    </ProtocolRequestDetailPanel>
  );
}

function ProtocolRequestDetailPanel({
  autoExpand,
  children,
  header,
}: {
  autoExpand: boolean;
  children: ReactNode;
  header: ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(autoExpand);

  return (
    <>
      <h3 className={styles.AccordionHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <MaterialIcon iconSize="2xl">{isExpanded ? "arrow_drop_down" : "arrow_right"}</MaterialIcon>
        {header}
      </h3>
      {isExpanded && children}
    </>
  );
}
