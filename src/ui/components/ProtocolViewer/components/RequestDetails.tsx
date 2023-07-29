import { useContext, useMemo } from "react";

import { formatExpressionToken } from "replay-next/components/console/utils/formatExpressionToken";
import Expandable from "replay-next/components/Expandable";
import SyntaxHighlightedLine from "replay-next/components/sources/SyntaxHighlightedLine";
import { parse } from "replay-next/src/suspense/SyntaxParsingCache";
import { ProtocolViewerContext } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";
import { useBugReportLink } from "ui/components/ProtocolViewer/hooks/useBugReportLink";
import { useHoneycombQueryLink } from "ui/components/ProtocolViewer/hooks/useHoneycombQueryLink";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { formatDuration, formatTimestamp } from "ui/utils/time";

import styles from "./RequestDetails.module.css";

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
            className={styles.BugReportLink}
            href={bugReportLink}
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

  return (
    <Expandable
      children={<SyntaxHighlightedExpression value={content} />}
      childrenClassName={styles.SectionChildren}
      className={styles.SectionExpandable}
      defaultOpen={true}
      header={
        <>
          <div className={styles.SectionHeaderTitle}>{header}</div>
          {time !== null && <div className={styles.SectionHeaderTime}>{formatTimestamp(time)}</div>}
        </>
      }
      headerClassName={styles.SectionHeader}
    />
  );
}

function SyntaxHighlightedExpression({ value }: { value: object }) {
  const jsonText = JSON.stringify(value, null, 2);
  const parsedTokens = parse(jsonText, "json");
  const formattedTokens = useMemo(
    () => parsedTokens.map(tokens => tokens.map(formatExpressionToken)),
    [parsedTokens]
  );

  return (
    <div className={styles.JsonPreview}>
      {formattedTokens.map((tokens, index) => (
        <SyntaxHighlightedLine code={jsonText} fileExtension="json" key={index} tokens={tokens} />
      ))}
    </div>
  );
}
