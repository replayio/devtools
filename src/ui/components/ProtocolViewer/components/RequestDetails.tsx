import { useContext } from "react";

import Expandable from "replay-next/components/Expandable";
import Icon from "replay-next/components/Icon";
import { JsonViewer } from "replay-next/components/SyntaxHighlighter/JsonViewer";
import { ProtocolViewerContext } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";
import { useBugReportLink } from "ui/components/ProtocolViewer/hooks/useBugReportLink";
import { useHoneycombQueryLink } from "ui/components/ProtocolViewer/hooks/useHoneycombQueryLink";
import { formatDuration, formatTimestamp } from "ui/utils/time";

import styles from "./RequestDetails.module.css";

const SYNTAX_HIGHLIGHT_MAX_LENGTH = 1_000;

export function RequestDetails() {
  const { errorMap, requestMap, responseMap, selectedRequestId } =
    useContext(ProtocolViewerContext);

  const bugReportLink = useBugReportLink();
  const honeycombQueryLink = useHoneycombQueryLink();

  if (selectedRequestId === null) {
    return (
      <div className={styles.Details}>
        <div className={styles.NoSelection}>Select a request to view its details</div>
      </div>
    );
  }

  const error = errorMap[selectedRequestId];
  const request = requestMap[selectedRequestId];
  const response = responseMap[selectedRequestId];

  return (
    <div className={styles.Details}>
      <div className={styles.HeaderRow}>
        <div className={styles.HeaderTitle}>{request.method}</div>
        {bugReportLink != null && (
          <a
            href={bugReportLink}
            rel="noreferrer noopener"
            target="_blank"
            title="Report protocol bug"
          >
            <Icon className={styles.BugReportIcon} type="bug" />
          </a>
        )}
        {honeycombQueryLink != null && (
          <a
            href={honeycombQueryLink}
            rel="noreferrer noopener"
            target="_blank"
            title="View in Honeycomb"
          >
            <Icon className={styles.HoneycombIcon} type="chart" />
          </a>
        )}
        {response && (
          <div className={styles.HeaderTimestamp}>
            {formatDuration(response.recordedAt - request.recordedAt)}
          </div>
        )}
      </div>

      <div className={styles.Sections} key={selectedRequestId}>
        <Section content={request} header="Request" time={request?.recordedAt ?? null} />
        <Section content={response} header="Response" time={response?.recordedAt ?? null} />
        <Section content={error} header="Error" time={error?.recordedAt ?? null} />
      </div>
    </div>
  );
}

function Section({
  content,
  header,
  time,
}: {
  content: object;
  header: string;
  time: number | null;
}) {
  if (content == null) {
    return content;
  }

  const jsonText = JSON.stringify(content, null, 2);

  let children = null;
  if (jsonText.length > SYNTAX_HIGHLIGHT_MAX_LENGTH) {
    children = <div className={styles.JsonViewer}>{jsonText}</div>;
  } else {
    children = <JsonViewer className={styles.JsonViewer} jsonText={jsonText} />;
  }

  return (
    <>
      <div className={styles.SectionHeader}>
        <div className={styles.SectionHeaderTitle}>{header}</div>
        {time !== null && <div className={styles.SectionHeaderTime}>{formatTimestamp(time)}</div>}
      </div>
      {children}
    </>
  );
}
