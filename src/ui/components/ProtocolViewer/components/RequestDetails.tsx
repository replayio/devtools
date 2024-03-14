import { Suspense, useContext, useMemo } from "react";

import Icon from "replay-next/components/Icon";
import { LoadingProgressBar } from "replay-next/components/LoadingProgressBar";
import { JsonViewer } from "replay-next/components/SyntaxHighlighter/JsonViewer";
import { useJsonViewerContextMenu } from "replay-next/components/SyntaxHighlighter/useJsonViewerContextMenu";
import { ProtocolViewerContext } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";
import { useBugReportLink } from "ui/components/ProtocolViewer/hooks/useBugReportLink";
import { useHoneycombQueryLink } from "ui/components/ProtocolViewer/hooks/useHoneycombQueryLink";
import { formatDuration, formatTimestamp } from "ui/utils/time";

import styles from "./RequestDetails.module.css";

const SYNTAX_HIGHLIGHT_MAX_LENGTH = 1_000;
const PLAIN_TEXT_MAX_LENGTH = 100_000;

export function RequestDetails() {
  return (
    <Suspense fallback={<LoadingProgressBar />}>
      <RequestDetailsSuspends />
    </Suspense>
  );
}

function RequestDetailsSuspends() {
  const { errorMap, requestMap, responseMap, selectedRequestId } =
    useContext(ProtocolViewerContext);

  const bugReportLink = useBugReportLink();
  const honeycombQueryLink = useHoneycombQueryLink();

  const nothingSelected = (
    <div className={styles.Details}>
      <div className={styles.NoSelection}>Select a request to view its details</div>
    </div>
  );

  if (selectedRequestId === null) {
    return nothingSelected;
  }

  const error = errorMap[selectedRequestId];
  const request = requestMap[selectedRequestId];
  const response = responseMap[selectedRequestId];

  // Every entry must have a request.
  // But, if the focus window has slide around, the selected
  // request ID may be out of date and we don't have anything
  // available to show for the focus range.
  if (!request) {
    return nothingSelected;
  }

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
  const [jsonText, isTruncated] = useMemo(() => {
    if (content == null) {
      return ["", false];
    }

    const string = JSON.stringify(content, null, 2);
    if (string.length > PLAIN_TEXT_MAX_LENGTH) {
      return [string.substring(0, PLAIN_TEXT_MAX_LENGTH), true];
    } else {
      return [string, false];
    }
  }, [content]);

  if (content == null) {
    return content;
  }

  let children = null;
  if (jsonText.length > SYNTAX_HIGHLIGHT_MAX_LENGTH) {
    children = <PlainTextJson jsonText={jsonText} isTruncated={isTruncated} />;
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

function PlainTextJson({ jsonText, isTruncated }: { jsonText: string; isTruncated: boolean }) {
  const { contextMenu, onContextMenu } = useJsonViewerContextMenu(jsonText);

  return (
    <>
      <div className={styles.JsonViewer} onContextMenu={onContextMenu}>
        {jsonText}
        {isTruncated ? "…" : ""}
      </div>
      {contextMenu}
    </>
  );
}
